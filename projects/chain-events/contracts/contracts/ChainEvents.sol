// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract ChainEvents is ERC721, ReentrancyGuard {
    using Strings for uint256;

    struct Event {
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 ticketPrice;
        uint256 maxSupply;
        uint256 sold;
        address organizer;
        address treasury;
        bool active;
    }

    uint256 public eventCounter;
    uint256 public nextTokenId = 1;

    mapping(uint256 => Event) public events;
    mapping(uint256 => uint256) public tokenEvent;
    mapping(uint256 => bool) public tokenUsed;
    mapping(uint256 => mapping(address => bool)) public scannerAllowed;

    event EventCreated(
        uint256 eventId,
        address organizer,
        string name,
        uint256 startTime,
        uint256 endTime,
        uint256 ticketPrice,
        uint256 maxSupply,
        address treasury
    );
    event EventDeleted(uint256 eventId, address organizer);
    event TicketPurchased(
        uint256 eventId,
        uint256 tokenId,
        address buyer,
        uint256 price,
        address treasury
    );
    event ScannerUpdated(uint256 eventId, address scanner, bool allowed);
    event TicketCheckedIn(
        uint256 eventId,
        uint256 tokenId,
        address attendee,
        address scanner,
        uint256 timestamp
    );

    constructor() ERC721("ChainPass Event Ticket", "CPASS") {}

    modifier eventExists(uint256 eventId) {
        require(events[eventId].organizer != address(0), "event does not exist");
        _;
    }

    modifier onlyOrganizer(uint256 eventId) {
        require(msg.sender == events[eventId].organizer, "not organizer");
        _;
    }

    function createEvent(
        string calldata name,
        string calldata description,
        uint256 startTime,
        uint256 endTime,
        uint256 ticketPrice,
        uint256 maxSupply,
        address treasury
    ) external returns (uint256 eventId) {
        require(bytes(name).length > 0, "name required");
        require(endTime >= startTime, "endTime before startTime");
        require(ticketPrice > 0, "ticket price required");
        require(maxSupply > 0, "max supply required");
        require(treasury != address(0), "treasury required");

        eventCounter++;
        eventId = eventCounter;

        events[eventId] = Event({
            name: name,
            description: description,
            startTime: startTime,
            endTime: endTime,
            ticketPrice: ticketPrice,
            maxSupply: maxSupply,
            sold: 0,
            organizer: msg.sender,
            treasury: treasury,
            active: true
        });

        emit EventCreated(
            eventId,
            msg.sender,
            name,
            startTime,
            endTime,
            ticketPrice,
            maxSupply,
            treasury
        );
    }

    function buyTicket(uint256 eventId)
        external
        payable
        nonReentrant
        eventExists(eventId)
        returns (uint256 tokenId)
    {
        Event storage eventData = events[eventId];

        require(eventData.active, "event inactive");
        require(block.timestamp <= eventData.endTime, "event ended");
        require(eventData.sold < eventData.maxSupply, "sold out");
        require(msg.value == eventData.ticketPrice, "wrong ticket price");

        tokenId = nextTokenId;
        nextTokenId++;
        eventData.sold++;
        tokenEvent[tokenId] = eventId;

        _safeMint(msg.sender, tokenId);

        (bool sent, ) = payable(eventData.treasury).call{value: msg.value}("");
        require(sent, "treasury transfer failed");

        emit TicketPurchased(eventId, tokenId, msg.sender, msg.value, eventData.treasury);
    }

    function setScanner(uint256 eventId, address scanner, bool allowed)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
    {
        require(scanner != address(0), "scanner required");
        require(events[eventId].active, "event inactive");

        scannerAllowed[eventId][scanner] = allowed;

        emit ScannerUpdated(eventId, scanner, allowed);
    }

    function checkIn(uint256 eventId, uint256 tokenId) external eventExists(eventId) {
        Event storage eventData = events[eventId];

        require(eventData.active, "event inactive");
        require(block.timestamp >= eventData.startTime, "event not started");
        require(block.timestamp <= eventData.endTime, "event ended");
        require(
            msg.sender == eventData.organizer || scannerAllowed[eventId][msg.sender],
            "not allowed"
        );
        require(tokenEvent[tokenId] == eventId, "wrong event token");
        require(!tokenUsed[tokenId], "token already used");

        address attendee = ownerOf(tokenId);
        tokenUsed[tokenId] = true;

        emit TicketCheckedIn(eventId, tokenId, attendee, msg.sender, block.timestamp);
    }

    function isValidTicket(uint256 eventId, uint256 tokenId) external view returns (bool) {
        return _isValidTicket(eventId, tokenId);
    }

    function getEvent(uint256 eventId) external view eventExists(eventId) returns (Event memory) {
        return events[eventId];
    }

    function deleteEvent(uint256 eventId) external eventExists(eventId) onlyOrganizer(eventId) {
        require(events[eventId].active, "event inactive");

        events[eventId].active = false;

        emit EventDeleted(eventId, msg.sender);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "token does not exist");

        uint256 eventId = tokenEvent[tokenId];
        Event storage eventData = events[eventId];
        string memory checkedInText = tokenUsed[tokenId] ? "true" : "false";

        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name":"ChainPass Ticket #',
                    tokenId.toString(),
                    '","description":"Transferable ChainPass event ticket.",',
                    '"attributes":[',
                    '{"trait_type":"Event ID","value":"',
                    eventId.toString(),
                    '"},',
                    '{"trait_type":"Start Time","value":"',
                    eventData.startTime.toString(),
                    '"},',
                    '{"trait_type":"End Time","value":"',
                    eventData.endTime.toString(),
                    '"},',
                    '{"trait_type":"Ticket Price","value":"',
                    eventData.ticketPrice.toString(),
                    '"},',
                    '{"trait_type":"Checked In","value":"',
                    checkedInText,
                    '"}',
                    "]}"
                )
            )
        );

        return string.concat("data:application/json;base64,", json);
    }

    function _isValidTicket(uint256 eventId, uint256 tokenId) internal view returns (bool) {
        return
            tokenEvent[tokenId] == eventId &&
            _ownerOf(tokenId) != address(0) &&
            events[eventId].active &&
            block.timestamp >= events[eventId].startTime &&
            block.timestamp <= events[eventId].endTime &&
            !tokenUsed[tokenId];
    }
}
