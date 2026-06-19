// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ChainInvite {
    // Egy esemeny osszes alapadata egy structban van.
    // A struct mezoi storage-ban tarolodnak, ezert csak azt tartsuk itt,
    // amire a contractnak tenyleg szuksege van.
    struct Event {
        string name;
        string description;
        uint256 startTime;
        address organizer;
        bool active;
    }

    // Egyszeru auto-increment id. Az elso letrehozott esemeny id-ja 1 lesz.
    uint256 public eventCounter;

    // eventId => Event adat.
    // A public mappinghez a Solidity automatikusan general egy olvaso fuggvenyt.
    mapping(uint256 => Event) public events;

    // eventId => guest address => meghivott-e.
    // A nested mapping gyors, de nem bejarhato: listazashoz frontend oldalon
    // az emitted eventeket vagy kulon tombot kell hasznalni.
    mapping(uint256 => mapping(address => bool)) public invited;

    // eventId => guest address => mar be lett-e leptetve.
    // Ez adja az egyszer hasznalatos QR/meghivo logikat.
    mapping(uint256 => mapping(address => bool)) public checkedIn;

    // eventId => scanner address => jogosult-e check-int inditani.
    mapping(uint256 => mapping(address => bool)) public scannerAllowed;

    // Az eventek olcso, frontend-barát naplo bejegyzesek.
    // A kesobbi UI ezekbol tudja visszakeresni, mi tortent on-chain.
    event EventCreated(uint256 eventId, address organizer, string name, uint256 startTime);
    event GuestInvited(uint256 eventId, address guest);
    event ScannerUpdated(uint256 eventId, address scanner, bool allowed);
    event GuestCheckedIn(uint256 eventId, address guest, address scanner, uint256 timestamp);

    // Ures mapping elemnel az organizer address(0), ezt hasznaljuk
    // "nem letezo esemeny" jelzesre.
    modifier eventExists(uint256 eventId) {
        require(events[eventId].organizer != address(0), "event does not exist");
        _;
    }

    // A modifier ujrahasznalhato jogosultsagi kapu.
    // A "_;" helyere fut be a vedett fuggveny torzse, ha a require atment.
    modifier onlyOrganizer(uint256 eventId) {
        require(msg.sender == events[eventId].organizer, "not organizer");
        _;
    }

    // external: kivulrol hivhato, a contracton belul kozvetlenul nem.
    // calldata: olcsobb input memoria stringekhez/tombokhoz, ha nem modositjuk oket.
    function createEvent(
        string calldata name,
        string calldata description,
        uint256 startTime
    ) external returns (uint256 eventId) {
        require(bytes(name).length > 0, "name required");

        // Eloszor noveljuk a szamlalot, igy nincs 0-s eventId.
        eventCounter++;
        eventId = eventCounter;

        // msg.sender mindig az aktualis tranzakcio hivoja.
        // Itt o lesz az esemeny szervezoje.
        events[eventId] = Event({
            name: name,
            description: description,
            startTime: startTime,
            organizer: msg.sender,
            active: true
        });

        emit EventCreated(eventId, msg.sender, name, startTime);
    }

    // Egy vendeg meghivasa csak letezo esemenyre es csak organizerkent engedett.
    function inviteGuest(uint256 eventId, address guest)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
    {
        _inviteGuest(eventId, guest);
    }

    // Tobb meghivo egy tranzakcioban. Ez kenyelmes, de hosszu listanal draga
    // lehet gas szempontbol, ezert MVP-ben kis listakra valo.
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

    // Scanner engedelyezese vagy tiltasa. A scanner a helyszini belepteto wallet.
    function setScanner(uint256 eventId, address scanner, bool allowed)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
    {
        require(scanner != address(0), "scanner required");

        scannerAllowed[eventId][scanner] = allowed;

        emit ScannerUpdated(eventId, scanner, allowed);
    }

    // A check-in state-et valtoztat, ezert tranzakcio.
    // Hivhatja az organizer vagy egy elore engedelyezett scanner.
    function checkIn(uint256 eventId, address guest) external eventExists(eventId) {
        // storage referencia: nem masolatot keszitunk, hanem a tarolt Eventre mutatunk.
        Event storage eventData = events[eventId];

        require(
            msg.sender == eventData.organizer || scannerAllowed[eventId][msg.sender],
            "not allowed"
        );

        // A vendegnek meghivottnak kell lennie, es csak egyszer lephet be.
        require(invited[eventId][guest], "guest not invited");
        require(!checkedIn[eventId][guest], "already checked in");

        checkedIn[eventId][guest] = true;

        emit GuestCheckedIn(eventId, guest, msg.sender, block.timestamp);
    }

    // view fuggveny: nem modosit state-et, ezert frontendbol ingyenes RPC olvasas.
    function isValidInvite(uint256 eventId, address guest) external view returns (bool) {
        return invited[eventId][guest] && !checkedIn[eventId][guest];
    }

    // Teljes Event struct visszaadasa. A memory itt azt jelenti, hogy a visszateresi
    // adat ideiglenes masolat, nem kozvetlen storage referencia.
    function getEvent(uint256 eventId) external view eventExists(eventId) returns (Event memory) {
        return events[eventId];
    }

    // Belső helper, hogy az inviteGuest es inviteMany ugyanazt a logikat hasznalja.
    function _inviteGuest(uint256 eventId, address guest) internal {
        require(guest != address(0), "guest required");

        invited[eventId][guest] = true;

        emit GuestInvited(eventId, guest);
    }
}
