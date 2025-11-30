export interface MenuItem {
  label: string;
  route: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { label: 'Time Converter', route: '/time-converter' },
  { label: 'Password Generator', route: '/password-generator' },
  { label: 'Hash Generator', route: '/hash-generator' },
  { label: 'Text Counter', route: '/text-counter' },
  { label: 'QR Code Generator', route: '/qr-code-generator' },
  { label: 'UUID Generator', route: '/uuid-generator' },
  { label: 'Circuit Game', route: '/circuit-game' },
  { label: 'Snake Game (online)', route: '/snake-game' },
  { label: 'Battleship Game (online)', route: '/battleship-game' },
  { label: 'One Time Encrypted Secret Message', route: '/secret-message' },
  { label: 'Random Number Generator', route: '/random-number-generator' },
  { label: 'Base64 Utility', route: '/base64-utility' },
  { label: 'Chat Room', route: '/chat-room-create' },
];
