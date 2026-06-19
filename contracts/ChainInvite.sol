// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ChainInvite {
    struct Event {
        string name;
        string description;
        uint256 startTime;
        address organizer;
        bool active;
    }

    uint256 public eventCounter;

    mapping(uint256 => Event) public events;
    mapping(uint256 => mapping(address => bool)) public invited;
    mapping(uint256 => mapping(address => bool)) public checkedIn;
    mapping(uint256 => mapping(address => bool)) public scannerAllowed;

    event EventCreated(uint256 eventId, address organizer, string name, uint256 startTime);
    event GuestInvited(uint256 eventId, address guest);
    event ScannerUpdated(uint256 eventId, address scanner, bool allowed);
    event GuestCheckedIn(uint256 eventId, address guest, address scanner, uint256 timestamp);

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
    {
        _inviteGuest(eventId, guest);
    }

    function inviteMany(uint256 eventId, address[] calldata guests)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
    {
        require(guests.length > 0, "guests required");

        for (uint256 i = 0; i < guests.length; i++) {
            _inviteGuest(eventId, guests[i]);
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

    function checkIn(uint256 eventId, address guest) external eventExists(eventId) {
        Event storage eventData = events[eventId];

        require(
            msg.sender == eventData.organizer || scannerAllowed[eventId][msg.sender],
            "not allowed"
        );
        require(invited[eventId][guest], "guest not invited");
        require(!checkedIn[eventId][guest], "already checked in");

        checkedIn[eventId][guest] = true;

        emit GuestCheckedIn(eventId, guest, msg.sender, block.timestamp);
    }

    function isValidInvite(uint256 eventId, address guest) external view returns (bool) {
        return invited[eventId][guest] && !checkedIn[eventId][guest];
    }

    function getEvent(uint256 eventId) external view eventExists(eventId) returns (Event memory) {
        return events[eventId];
    }

    function _inviteGuest(uint256 eventId, address guest) internal {
        require(guest != address(0), "guest required");

        invited[eventId][guest] = true;

        emit GuestInvited(eventId, guest);
    }
}
