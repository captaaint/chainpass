# QR Codes

ChainInvite uses two QR libraries:

- `qrcode` to generate QR images on guest pages.
- `html5-qrcode` to scan QR codes with the browser camera on scanner pages.

## Generated Payload

The base flow uses:

```json
{ "eventId": "1", "guest": "0x..." }
```

The NFT flow also includes `tokenId`.

## Scanner Flow

1. Open the camera.
2. Read QR text.
3. Parse JSON.
4. Validate `eventId` and wallet address.
5. Read invite validity from the contract.
6. Send `checkIn` if valid.

## Browser Requirement

Camera access requires HTTPS or localhost.

## Documentation

- https://www.npmjs.com/package/qrcode
- https://www.npmjs.com/package/html5-qrcode
- https://www.npmjs.com/package/@zxing/browser
