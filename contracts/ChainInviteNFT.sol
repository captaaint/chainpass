// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract ChainInviteNFT is ERC721 {
    using Strings for uint256;

    string private constant TICKET_IMAGE_URI =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIGZpbGw9IiNmNmY0ZWUiLz48cmVjdCB4PSIxMzIiIHk9IjI0MCIgd2lkdGg9Ijc2MCIgaGVpZ2h0PSI1NDQiIHJ4PSI1NiIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMWQ2ZjY4IiBzdHJva2Utd2lkdGg9IjI0Ii8+PGNpcmNsZSBjeD0iMTMyIiBjeT0iNTEyIiByPSI1NiIgZmlsbD0iI2Y2ZjRlZSIvPjxjaXJjbGUgY3g9Ijg5MiIgY3k9IjUxMiIgcj0iNTYiIGZpbGw9IiNmNmY0ZWUiLz48dGV4dCB4PSI1MTIiIHk9IjQ1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjcyIiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjMWQyNTI3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DaGFpbkludml0ZTwvdGV4dD48dGV4dCB4PSI1MTIiIHk9IjU0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiBmaWxsPSIjNWY2ZjUyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FUkMtNzIxIFRpY2tldDwvdGV4dD48dGV4dCB4PSI1MTIiIHk9IjYyMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjMwIiBmaWxsPSIjNWNjNzYzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TZXBvbGlhIHRlc3RuZXQ8L3RleHQ+PC9zdmc+";

    struct Event {
        string name;
        string description;
        uint256 startTime;
        address organizer;
        bool active;
    }

    uint256 public eventCounter;
    uint256 public nextTokenId = 1;

    mapping(uint256 => Event) public events;
    mapping(uint256 => mapping(address => bool)) public invited;
    mapping(uint256 => mapping(address => bool)) public checkedIn;
    mapping(uint256 => mapping(address => bool)) public scannerAllowed;

    mapping(uint256 => uint256) public tokenEvent;
    mapping(uint256 => bool) public tokenUsed;
    mapping(uint256 => mapping(address => uint256)) public guestToken;

    event EventCreated(uint256 eventId, address organizer, string name, uint256 startTime);
    event GuestInvited(uint256 eventId, address guest);
    event InviteMinted(uint256 eventId, address guest, uint256 tokenId);
    event ScannerUpdated(uint256 eventId, address scanner, bool allowed);
    event GuestCheckedIn(
        uint256 eventId,
        address guest,
        address scanner,
        uint256 tokenId,
        uint256 timestamp
    );

    constructor() ERC721("ChainInvite Ticket", "CINV") {}

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
        uint256 startTime
    ) external returns (uint256 eventId) {
        require(bytes(name).length > 0, "name required");

        eventCounter++;
        eventId = eventCounter;

        events[eventId] = Event({
            name: name,
            description: description,
            startTime: startTime,
            organizer: msg.sender,
            active: true
        });

        emit EventCreated(eventId, msg.sender, name, startTime);
    }

    function inviteGuest(uint256 eventId, address guest)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
        returns (uint256 tokenId)
    {
        tokenId = _mintInvite(eventId, guest);
    }

    function inviteMany(uint256 eventId, address[] calldata guests)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
    {
        require(guests.length > 0, "guests required");

        for (uint256 i = 0; i < guests.length; i++) {
            _mintInvite(eventId, guests[i]);
        }
    }

    function setScanner(uint256 eventId, address scanner, bool allowed)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
    {
        require(scanner != address(0), "scanner required");

        scannerAllowed[eventId][scanner] = allowed;

        emit ScannerUpdated(eventId, scanner, allowed);
    }

    function checkIn(uint256 eventId, address guest, uint256 tokenId) external eventExists(eventId) {
        Event storage eventData = events[eventId];

        require(
            msg.sender == eventData.organizer || scannerAllowed[eventId][msg.sender],
            "not allowed"
        );
        require(tokenEvent[tokenId] == eventId, "wrong event token");
        require(ownerOf(tokenId) == guest, "guest does not own token");
        require(!tokenUsed[tokenId], "token already used");

        tokenUsed[tokenId] = true;
        checkedIn[eventId][guest] = true;

        emit GuestCheckedIn(eventId, guest, msg.sender, tokenId, block.timestamp);
    }

    function isValidInvite(uint256 eventId, address guest) external view returns (bool) {
        uint256 tokenId = guestToken[eventId][guest];

        return _isValidInvite(eventId, guest, tokenId);
    }

    function isValidToken(uint256 eventId, address guest, uint256 tokenId) external view returns (bool) {
        return _isValidInvite(eventId, guest, tokenId);
    }

    function getEvent(uint256 eventId) external view eventExists(eventId) returns (Event memory) {
        return events[eventId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "token does not exist");

        Event storage eventData = events[tokenEvent[tokenId]];
        string memory checkedInText = tokenUsed[tokenId] ? "true" : "false";

        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name":"ChainInvite Ticket #',
                    tokenId.toString(),
                    '","description":"',
                    eventData.description,
                    '","image":"',
                    TICKET_IMAGE_URI,
                    '","attributes":[',
                    '{"trait_type":"Event","value":"',
                    eventData.name,
                    '"},',
                    '{"trait_type":"Event ID","value":"',
                    tokenEvent[tokenId].toString(),
                    '"},',
                    '{"trait_type":"Start Time","value":"',
                    eventData.startTime.toString(),
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

    function _mintInvite(uint256 eventId, address guest) internal returns (uint256 tokenId) {
        require(guest != address(0), "guest required");
        require(guestToken[eventId][guest] == 0, "guest already invited");

        tokenId = nextTokenId;
        nextTokenId++;

        guestToken[eventId][guest] = tokenId;
        tokenEvent[tokenId] = eventId;
        invited[eventId][guest] = true;

        _safeMint(guest, tokenId);

        emit GuestInvited(eventId, guest);
        emit InviteMinted(eventId, guest, tokenId);
    }

    function _isValidInvite(uint256 eventId, address guest, uint256 tokenId)
        internal
        view
        returns (bool)
    {
        return
            tokenId != 0 &&
            tokenEvent[tokenId] == eventId &&
            _ownerOf(tokenId) == guest &&
            !tokenUsed[tokenId];
    }
}
