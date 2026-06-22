// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ChainInvite {
    // Core event data is stored in one struct.
    // Struct fields live in storage, so keep only data the contract actually needs.
    struct Event {
        string name;
        string description;
        uint256 startTime;
        address organizer;
        bool active;
    }

    // Simple auto-incrementing id. The first created event id is 1.
    uint256 public eventCounter;

    // eventId => event data.
    // Solidity automatically generates a reader for public mappings.
    mapping(uint256 => Event) public events;

    // eventId => guest address => invited.
    // Nested mappings are fast but not iterable; lists need events or separate arrays.
    mapping(uint256 => mapping(address => bool)) public invited;

    // eventId => guest address => already checked in.
    // This powers the single-use QR/invite logic.
    mapping(uint256 => mapping(address => bool)) public checkedIn;

    // eventId => scanner address => allowed to run check-in.
    mapping(uint256 => mapping(address => bool)) public scannerAllowed;

    // Events are cheap UI-friendly log entries.
    // The UI can reconstruct on-chain activity from them.
    event EventCreated(uint256 eventId, address organizer, string name, uint256 startTime);
    event EventDeleted(uint256 eventId, address organizer);
    event GuestInvited(uint256 eventId, address guest);
    event ScannerUpdated(uint256 eventId, address scanner, bool allowed);
    event GuestCheckedIn(uint256 eventId, address guest, address scanner, uint256 timestamp);

    // Empty mapping entries have organizer address(0), which marks missing events.
    modifier eventExists(uint256 eventId) {
        require(events[eventId].organizer != address(0), "event does not exist");
        _;
    }

    // Reusable authorization gate.
    // The protected function body runs at "_;" after the require passes.
    modifier onlyOrganizer(uint256 eventId) {
        require(msg.sender == events[eventId].organizer, "not organizer");
        _;
    }

    // external: callable from outside the contract.
    // calldata is cheaper for input strings/arrays when they are not modified.
    function createEvent(
        string calldata name,
        string calldata description,
        uint256 startTime
    ) external returns (uint256 eventId) {
        require(bytes(name).length > 0, "name required");

        // Increment first so event id 0 is never used.
        eventCounter++;
        eventId = eventCounter;

        // msg.sender is the current transaction caller, so it becomes the organizer.
        events[eventId] = Event({
            name: name,
            description: description,
            startTime: startTime,
            organizer: msg.sender,
            active: true
        });

        emit EventCreated(eventId, msg.sender, name, startTime);
    }

    // Inviting a guest is allowed only for existing events and only by the organizer.
    function inviteGuest(uint256 eventId, address guest)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
    {
        require(events[eventId].active, "event inactive");

        _inviteGuest(eventId, guest);
    }

    // Invite multiple guests in one transaction. Useful, but expensive for long lists.
    function inviteMany(uint256 eventId, address[] calldata guests)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
    {
        require(guests.length > 0, "guests required");
        require(events[eventId].active, "event inactive");

        for (uint256 i = 0; i < guests.length; i++) {
            _inviteGuest(eventId, guests[i]);
        }
    }

    // Allow or revoke a scanner wallet.
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

    // Check-in changes state, so it is a transaction.
    // It can be called by the organizer or by an approved scanner.
    function checkIn(uint256 eventId, address guest) external eventExists(eventId) {
        // Storage reference: points to the stored Event instead of copying it.
        Event storage eventData = events[eventId];
        require(eventData.active, "event inactive");

        require(
            msg.sender == eventData.organizer || scannerAllowed[eventId][msg.sender],
            "not allowed"
        );

        // The guest must be invited and can check in only once.
        require(invited[eventId][guest], "guest not invited");
        require(!checkedIn[eventId][guest], "already checked in");

        checkedIn[eventId][guest] = true;

        emit GuestCheckedIn(eventId, guest, msg.sender, block.timestamp);
    }

    // View function: does not modify state, so the UI can read it through RPC.
    function isValidInvite(uint256 eventId, address guest) external view returns (bool) {
        return events[eventId].active && invited[eventId][guest] && !checkedIn[eventId][guest];
    }

    // Return the full Event struct. memory means a temporary return copy.
    function getEvent(uint256 eventId) external view eventExists(eventId) returns (Event memory) {
        return events[eventId];
    }

    function deleteEvent(uint256 eventId) external eventExists(eventId) onlyOrganizer(eventId) {
        require(events[eventId].active, "event inactive");

        events[eventId].active = false;

        emit EventDeleted(eventId, msg.sender);
    }

    // Internal helper shared by inviteGuest and inviteMany.
    function _inviteGuest(uint256 eventId, address guest) internal {
        require(guest != address(0), "guest required");

        invited[eventId][guest] = true;

        emit GuestInvited(eventId, guest);
    }
}
