import { Injectable } from '@angular/core';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.config';

export interface SecretMessage {
  id: string;
  encryptedMessage: string;
  durationInSeconds: number;
  createdAt: any;
  expiresAt: Date; // Auto-expire after 1 hour if not read
  readAt?: Date; // When the message was first read
}

export interface ChatRoom {
  roomId: string;
  createdAt: any;
  expiresAt: Date;
  status: 'active' | 'closed';
  participants: Array<{
    name: string;
    joinedAt: any;
  }>;
  maxParticipants: number;
}

export interface ChatMessage {
  id: string;
  participantName: string;
  message: string;
  timestamp: any;
}

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private readonly COLLECTION_NAME = 'secret_messages';

  /**
   * Store an encrypted message in Firestore
   */
  async storeMessage(encryptedMessage: string, durationInSeconds: number): Promise<{ messageId: string; secretKey: string }> {
    try {
      // Auto-expire after 1 hour if not read
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        encryptedMessage,
        durationInSeconds,
        createdAt: serverTimestamp(),
        expiresAt,
        readAt: null, // Not read yet
      });

      // Generate a random key for encryption/decryption
      const secretKey = this.generateRandomKey();

      return {
        messageId: docRef.id,
        secretKey,
      };
    } catch (error) {
      console.error('Error storing message:', error);
      throw error;
    }
  }

  /**
   * Retrieve a message from Firestore
   */
  async getMessage(messageId: string): Promise<SecretMessage | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, messageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        const message: SecretMessage = {
          id: docSnap.id,
          encryptedMessage: data['encryptedMessage'],
          durationInSeconds: data['durationInSeconds'],
          createdAt: data['createdAt'],
          expiresAt: data['expiresAt'].toDate(),
          readAt: data['readAt'] ? data['readAt'].toDate() : undefined,
        };

        // Check if message has auto-expired (1 hour limit)
        if (message.expiresAt < new Date()) {
          await this.deleteMessage(messageId);
          return null;
        }

        return message;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error retrieving message:', error);
      throw error;
    }
  }

  /**
   * Mark message as read and delete it immediately
   */
  async markAsReadAndDelete(messageId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, messageId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error marking message as read and deleting:', error);
      throw error;
    }
  }

  /**
   * Delete a message from Firestore
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, messageId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Clean up expired messages (optional utility method)
   */
  async cleanupExpiredMessages(): Promise<void> {
    try {
      const now = new Date();
      const q = query(collection(db, this.COLLECTION_NAME), where('expiresAt', '<', now));

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error cleaning up expired messages:', error);
      throw error;
    }
  }

  /**
   * Generate a random key between 30-50 characters
   */
  private generateRandomKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * 21) + 30; // 30-50 chars
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  /**
   * Generate a random password
   */
  private generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 32;
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  // ==================== BATTLESHIP GAME METHODS ====================

  /**
   * Create a new battleship game
   */
  async createBattleshipGame(
    name1: string,
    name2: string,
  ): Promise<{
    battleshipGameId: string;
    player1: { id: string; name: string; password: string };
    gameInvite: { id: string };
  }> {
    try {
      if (name1 === name2) {
        throw new Error('Usernames cannot be the same.');
      }

      const password1 = this.generatePassword();
      const password2 = this.generatePassword();

      // Create players
      const player1Ref = await addDoc(collection(db, 'battleship_players'), {
        name: name1,
        password: password1,
        createdAt: serverTimestamp(),
      });

      const player2Ref = await addDoc(collection(db, 'battleship_players'), {
        name: name2,
        password: password2,
        createdAt: serverTimestamp(),
      });

      // Create game
      const gameRef = await addDoc(collection(db, 'battleship_games'), {
        player1Id: player1Ref.id,
        player2Id: player2Ref.id,
        playerIdTurn: player1Ref.id,
        status: 'pending',
        player1PositionsSet: false,
        player2PositionsSet: false,
        player1Positions: {
          carrier: [],
          battleship: [],
          cruiser: [],
          submarine: [],
          destroyer: [],
        },
        player2Positions: {
          carrier: [],
          battleship: [],
          cruiser: [],
          submarine: [],
          destroyer: [],
        },
        playerIdWinner: null,
        winnerMessage: null,
        createdAt: serverTimestamp(),
      });

      // Create game invite
      const inviteRef = await addDoc(collection(db, 'game_invites'), {
        playerId: player2Ref.id,
        gameId: gameRef.id,
        gameType: 'battleship',
        createdAt: serverTimestamp(),
      });

      return {
        battleshipGameId: gameRef.id,
        player1: {
          id: player1Ref.id,
          name: name1,
          password: password1,
        },
        gameInvite: {
          id: inviteRef.id,
        },
      };
    } catch (error) {
      console.error('Error creating battleship game:', error);
      throw error;
    }
  }

  /**
   * Accept a game invite
   */
  async acceptBattleshipGameInvite(inviteId: string): Promise<{
    battleshipGameId: string;
    player: { id: string; name: string; password: string };
  }> {
    try {
      const inviteRef = doc(db, 'game_invites', inviteId);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        throw new Error('Game invite not found');
      }

      const inviteData = inviteSnap.data();
      const gameId = inviteData['gameId'];

      const gameRef = doc(db, 'battleship_games', gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();
      if (gameData['status'] !== 'pending') {
        throw new Error('Game is not pending');
      }

      const playerId = inviteData['playerId'];
      const playerRef = doc(db, 'battleship_players', playerId);
      const playerSnap = await getDoc(playerRef);

      if (!playerSnap.exists()) {
        throw new Error('Player not found');
      }

      const playerData = playerSnap.data();

      // Update game status and delete invite
      const batch = writeBatch(db);
      batch.update(gameRef, { status: 'pending_positions' });
      batch.delete(inviteRef);
      await batch.commit();

      return {
        battleshipGameId: gameId,
        player: {
          id: playerId,
          name: playerData['name'],
          password: playerData['password'],
        },
      };
    } catch (error) {
      console.error('Error accepting game invite:', error);
      throw error;
    }
  }

  /**
   * Set ship positions for a player
   */
  async setBattleshipPositions(
    gameId: string,
    playerId: string,
    playerPassword: string,
    positions: {
      carrier: Array<{ x: number; y: number }>;
      battleship: Array<{ x: number; y: number }>;
      cruiser: Array<{ x: number; y: number }>;
      submarine: Array<{ x: number; y: number }>;
      destroyer: Array<{ x: number; y: number }>;
    },
  ): Promise<void> {
    try {
      // Validate player
      const playerRef = doc(db, 'battleship_players', playerId);
      const playerSnap = await getDoc(playerRef);

      if (!playerSnap.exists() || playerSnap.data()['password'] !== playerPassword) {
        throw new Error('Player not found or invalid password');
      }

      // Get game
      const gameRef = doc(db, 'battleship_games', gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();

      if (gameData['status'] !== 'pending_positions') {
        throw new Error('Game is not in pending positions state');
      }

      if (gameData['player1Id'] !== playerId && gameData['player2Id'] !== playerId) {
        throw new Error('Player is not part of this game');
      }

      // Validate positions
      if (positions.carrier.length !== 5) {
        throw new Error('Carrier must be 5 cells long');
      }
      if (positions.battleship.length !== 4) {
        throw new Error('Battleship must be 4 cells long');
      }
      if (positions.cruiser.length !== 3) {
        throw new Error('Cruiser must be 3 cells long');
      }
      if (positions.submarine.length !== 3) {
        throw new Error('Submarine must be 3 cells long');
      }
      if (positions.destroyer.length !== 2) {
        throw new Error('Destroyer must be 2 cells long');
      }

      // Update positions
      const isPlayer1 = gameData['player1Id'] === playerId;
      const updateData: any = {};

      if (isPlayer1) {
        updateData['player1Positions'] = positions;
        updateData['player1PositionsSet'] = true;
      } else {
        updateData['player2Positions'] = positions;
        updateData['player2PositionsSet'] = true;
      }

      // Check if both players have set positions
      const player1PositionsSet = isPlayer1 ? true : gameData['player1PositionsSet'];
      const player2PositionsSet = isPlayer1 ? gameData['player2PositionsSet'] : true;

      if (player1PositionsSet && player2PositionsSet) {
        updateData['status'] = 'in_progress';
      }

      await updateDoc(gameRef, updateData);
    } catch (error) {
      console.error('Error setting positions:', error);
      throw error;
    }
  }

  /**
   * Make a move in the battleship game
   */
  async makeBattleshipMove(
    gameId: string,
    playerId: string,
    playerPassword: string,
    move: { x: number; y: number },
  ): Promise<{ message: string; shipSunk: string; move: { x: number; y: number; isHit: boolean } }> {
    try {
      // Validate player
      const playerRef = doc(db, 'battleship_players', playerId);
      const playerSnap = await getDoc(playerRef);

      if (!playerSnap.exists() || playerSnap.data()['password'] !== playerPassword) {
        throw new Error('Player not found or invalid password');
      }

      // Get game
      const gameRef = doc(db, 'battleship_games', gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();

      if (gameData['status'] !== 'in_progress') {
        throw new Error('Game is not in progress');
      }

      if (gameData['player1Id'] !== playerId && gameData['player2Id'] !== playerId) {
        throw new Error('Player is not part of this game');
      }

      if (gameData['playerIdTurn'] !== playerId) {
        throw new Error('It is not your turn');
      }

      // Check if move already exists
      const movesQuery = query(
        collection(db, 'battleship_games', gameId, 'moves'),
        where('playerId', '==', playerId),
        where('x', '==', move.x),
        where('y', '==', move.y),
      );
      const existingMoves = await getDocs(movesQuery);

      if (!existingMoves.empty) {
        throw new Error('You have already shot at this location.');
      }

      // Determine opponent positions
      const isPlayer1 = gameData['player1Id'] === playerId;
      const opponentPositions = isPlayer1 ? gameData['player2Positions'] : gameData['player1Positions'];
      const opponentId = isPlayer1 ? gameData['player2Id'] : gameData['player1Id'];

      // Check if hit
      const opponentPositionsXY: number[][] = [];
      for (const key in opponentPositions) {
        opponentPositions[key as keyof typeof opponentPositions].forEach((position: { x: number; y: number }) => {
          opponentPositionsXY.push([position.x, position.y]);
        });
      }

      const isHit = opponentPositionsXY.some((position) => position[0] === move.x && position[1] === move.y);

      // Create move
      await addDoc(collection(db, 'battleship_games', gameId, 'moves'), {
        playerId: playerId,
        x: move.x,
        y: move.y,
        hit: isHit,
        createdAt: serverTimestamp(),
      });

      // Update turn if miss
      if (!isHit) {
        await updateDoc(gameRef, {
          playerIdTurn: opponentId,
        });
      }

      // Check for ship sunk
      let shipSunk = '';
      if (isHit) {
        // Get all player moves
        const allMovesQuery = query(collection(db, 'battleship_games', gameId, 'moves'), where('playerId', '==', playerId));
        const allMovesSnap = await getDocs(allMovesQuery);
        const allPlayerMoves = allMovesSnap.docs.map((doc) => ({
          x: doc.data()['x'],
          y: doc.data()['y'],
          hit: doc.data()['hit'],
        }));

        // Check each ship
        for (const shipType in opponentPositions) {
          const shipPositions = opponentPositions[shipType as keyof typeof opponentPositions];
          const allPositionsHit = shipPositions.every((position: { x: number; y: number }) =>
            allPlayerMoves.some((m) => m.x === position.x && m.y === position.y),
          );

          if (
            allPositionsHit &&
            shipPositions.length > 0 &&
            shipPositions.some((position: { x: number; y: number }) => position.x === move.x && position.y === move.y)
          ) {
            shipSunk = shipType;
            break;
          }
        }

        // Check for game end (all ships sunk)
        if (shipSunk) {
          const allMovesForSunkCheck = [...allPlayerMoves, { x: move.x, y: move.y, hit: isHit }];
          let allShipsSunk = true;
          for (const shipType in opponentPositions) {
            const shipPositions = opponentPositions[shipType as keyof typeof opponentPositions];
            const allPositionsHit = shipPositions.every((position: { x: number; y: number }) =>
              allMovesForSunkCheck.some((m) => m.x === position.x && m.y === position.y),
            );
            if (!allPositionsHit || shipPositions.length === 0) {
              allShipsSunk = false;
              break;
            }
          }

          if (allShipsSunk) {
            await updateDoc(gameRef, {
              status: 'finished',
              playerIdWinner: playerId,
            });
          }
        }
      }

      return {
        message: 'Move added successfully',
        shipSunk,
        move: { x: move.x, y: move.y, isHit },
      };
    } catch (error) {
      console.error('Error making move:', error);
      throw error;
    }
  }

  /**
   * Subscribe to battleship game info updates (real-time)
   */
  subscribeToBattleshipGameInfo(
    gameId: string,
    playerId: string,
    playerPassword: string,
    callback: (gameInfo: any) => void,
  ): () => void {
    const gameRef = doc(db, 'battleship_games', gameId);
    const movesRef = collection(db, 'battleship_games', gameId, 'moves');

    let gameUnsubscribe: Unsubscribe;
    let movesUnsubscribe: Unsubscribe;

    const updateGameInfo = async () => {
      const gameSnap = await getDoc(gameRef);
      if (!gameSnap.exists()) {
        callback(null);
        return;
      }

      const gameData = gameSnap.data();

      // Validate player
      const playerRef = doc(db, 'battleship_players', playerId);
      const playerSnap = await getDoc(playerRef);

      if (!playerSnap.exists() || playerSnap.data()['password'] !== playerPassword) {
        callback(null);
        return;
      }

      if (gameData['player1Id'] !== playerId && gameData['player2Id'] !== playerId) {
        callback(null);
        return;
      }

      const opponentPlayerId = playerId === gameData['player1Id'] ? gameData['player2Id'] : gameData['player1Id'];
      const opponentPlayerRef = doc(db, 'battleship_players', opponentPlayerId);
      const opponentPlayerSnap = await getDoc(opponentPlayerRef);

      if (!opponentPlayerSnap.exists()) {
        callback(null);
        return;
      }

      const opponentName = opponentPlayerSnap.data()['name'];

      const positions = playerId === gameData['player1Id'] ? gameData['player1Positions'] : gameData['player2Positions'];
      const positionsAreSet =
        playerId === gameData['player1Id'] ? gameData['player1PositionsSet'] : gameData['player2PositionsSet'];
      const opponentPositionsAreSet =
        playerId === gameData['player1Id'] ? gameData['player2PositionsSet'] : gameData['player1PositionsSet'];

      // Get moves
      const movesQuery = query(collection(db, 'battleship_games', gameId, 'moves'));
      const movesSnap = await getDocs(movesQuery);
      const allMoves = movesSnap.docs.map((doc) => ({
        playerId: doc.data()['playerId'],
        x: doc.data()['x'],
        y: doc.data()['y'],
        hit: doc.data()['hit'],
      }));

      const moves = allMoves.filter((m) => m.playerId === playerId).map((m) => ({ x: m.x, y: m.y, hit: m.hit }));
      const opponentMoves = allMoves.filter((m) => m.playerId === opponentPlayerId).map((m) => ({ x: m.x, y: m.y, hit: m.hit }));

      // Calculate ships sank
      const shipsSank: string[] = [];
      const opponentShipsSank: string[] = [];

      if (positionsAreSet) {
        const playerPositions = playerId === gameData['player1Id'] ? gameData['player1Positions'] : gameData['player2Positions'];
        const opponentPositions =
          playerId === gameData['player1Id'] ? gameData['player2Positions'] : gameData['player1Positions'];

        // Check player's ships (opponent is targeting)
        for (const shipType in playerPositions) {
          const shipPositions = playerPositions[shipType as keyof typeof playerPositions];
          const allPositionsHit = shipPositions.every((position: { x: number; y: number }) =>
            opponentMoves.some((move) => move.x === position.x && move.y === position.y),
          );
          if (allPositionsHit && shipPositions.length > 0) {
            shipsSank.push(shipType);
          }
        }

        // Check opponent's ships (player is targeting)
        for (const shipType in opponentPositions) {
          const shipPositions = opponentPositions[shipType as keyof typeof opponentPositions];
          const allPositionsHit = shipPositions.every((position: { x: number; y: number }) =>
            moves.some((move) => move.x === position.x && move.y === position.y),
          );
          if (allPositionsHit && shipPositions.length > 0) {
            opponentShipsSank.push(shipType);
          }
        }
      }

      // Check for game end
      if (shipsSank.length === 5 || opponentShipsSank.length === 5) {
        const winnerId = shipsSank.length === 5 ? opponentPlayerId : playerId;
        if (gameData['status'] !== 'finished') {
          updateDoc(gameRef, {
            status: 'finished',
            playerIdWinner: winnerId,
          });
        }
      }

      const gameInfo = {
        status: gameData['status'],
        playerIdTurn: gameData['playerIdTurn'],
        positionsAreSet,
        opponentPositionsAreSet,
        playerIdWinner: gameData['playerIdWinner'] || null,
        winnerMessage: gameData['winnerMessage'] || null,
        opponentName,
        positions,
        moves,
        opponentMoves,
        shipsSank,
        opponentShipsSank,
      };

      callback(gameInfo);
    };

    // Listen to game document changes
    gameUnsubscribe = onSnapshot(gameRef, () => {
      updateGameInfo().catch((error) => {
        console.error('Error updating game info:', error);
      });
    });

    // Listen to moves subcollection changes
    movesUnsubscribe = onSnapshot(movesRef, () => {
      updateGameInfo().catch((error) => {
        console.error('Error updating game info:', error);
      });
    });

    // Return unsubscribe function
    return () => {
      gameUnsubscribe();
      movesUnsubscribe();
    };
  }

  /**
   * Post winner message
   */
  async postBattleshipWinnerMessage(gameId: string, playerId: string, playerPassword: string, message: string): Promise<void> {
    try {
      // Validate player
      const playerRef = doc(db, 'battleship_players', playerId);
      const playerSnap = await getDoc(playerRef);

      if (!playerSnap.exists() || playerSnap.data()['password'] !== playerPassword) {
        throw new Error('Player not found or invalid password');
      }

      // Get game
      const gameRef = doc(db, 'battleship_games', gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();

      if (gameData['player1Id'] !== playerId && gameData['player2Id'] !== playerId) {
        throw new Error('Player is not part of this game');
      }

      if (gameData['playerIdWinner'] !== playerId) {
        throw new Error('You are not the winner of this game');
      }

      await updateDoc(gameRef, {
        winnerMessage: message,
      });
    } catch (error) {
      console.error('Error posting winner message:', error);
      throw error;
    }
  }

  // ==================== SNAKE GAME METHODS ====================

  /**
   * Create a new snake game
   */
  async createSnakeGame(playerName: string): Promise<{ gameId: string; playerId: string }> {
    try {
      const playerId = this.generateRandomKey();
      const gameRef = await addDoc(collection(db, 'snake_games'), {
        status: 'waiting',
        createdAt: serverTimestamp(),
        players: {
          [playerId]: {
            name: playerName,
            score: 0,
            joinedAt: new Date(),
          },
        },
        highScore: 0,
        highScorePlayerName: playerName,
      });

      return { gameId: gameRef.id, playerId };
    } catch (error) {
      console.error('Error creating snake game:', error);
      throw error;
    }
  }

  /**
   * Join a snake game
   */
  async joinSnakeGame(gameId: string, playerName: string): Promise<{ playerId: string }> {
    try {
      const gameRef = doc(db, 'snake_games', gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();
      const players = gameData['players'] || {};

      // Check if game is finished
      if (gameData['status'] === 'finished') {
        throw new Error('Game is finished');
      }

      const playerId = this.generateRandomKey();

      // If 2nd player joining, start the game timer
      let updateData: any = {
        [`players.${playerId}`]: {
          name: playerName,
          score: 0,
          joinedAt: new Date(),
        },
      };

      if (Object.keys(players).length === 1) {
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 3 * 60 * 1000); // 3 minutes
        updateData['status'] = 'playing';
        updateData['startTime'] = startTime;
        updateData['endTime'] = endTime;
      }

      await updateDoc(gameRef, updateData);

      return { playerId };
    } catch (error) {
      console.error('Error joining snake game:', error);
      throw error;
    }
  }

  /**
   * Update snake game score
   */
  async updateSnakeScore(gameId: string, playerId: string, score: number): Promise<void> {
    try {
      const gameRef = doc(db, 'snake_games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (!gameSnap.exists()) return;

      const gameData = gameSnap.data();
      
      // Check if game is finished (time expired)
      if (gameData['endTime'] && gameData['endTime'].toDate() < new Date()) {
         if (gameData['status'] !== 'finished') {
             await updateDoc(gameRef, { status: 'finished' });
         }
         return; // Don't update score if finished
      }

      const currentHighScore = gameData['highScore'] || 0;
      const updates: any = {
        [`players.${playerId}.score`]: score,
      };

      if (score > currentHighScore) {
        updates['highScore'] = score;
        updates['highScorePlayerName'] = gameData['players'][playerId].name;
      }

      await updateDoc(gameRef, updates);
    } catch (error) {
      console.error('Error updating snake score:', error);
    }
  }

  /**
   * Subscribe to snake game updates
   */
  subscribeToSnakeGame(gameId: string, callback: (game: any) => void): () => void {
    const gameRef = doc(db, 'snake_games', gameId);
    
    return onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Convert timestamps
        const game = {
          ...data,
          id: doc.id,
          startTime: data['startTime']?.toDate(),
          endTime: data['endTime']?.toDate(),
          createdAt: data['createdAt']?.toDate(),
        };
        callback(game);
      } else {
        callback(null);
      }
    });
  }

  // ==================== CHAT ROOM METHODS ====================

  /**
   * Generate a random room ID (>40 characters)
   */
  private generateRandomRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * 11) + 41; // 41-51 chars
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  /**
   * Generate a random participant name (10 characters)
   */
  private generateRandomParticipantName(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 10;
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  /**
   * Create a new chat room
   */
  async createChatRoom(): Promise<{ roomId: string; participantName: string }> {
    try {
      const roomId = this.generateRandomRoomId();
      const participantName = this.generateRandomParticipantName();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const roomRef = doc(db, 'chat_rooms', roomId);

      // Check if room ID already exists (very unlikely but handle it)
      const existingRoom = await getDoc(roomRef);
      if (existingRoom.exists()) {
        // Retry with new ID
        return this.createChatRoom();
      }

      await setDoc(roomRef, {
        roomId,
        createdAt: serverTimestamp(),
        expiresAt,
        status: 'active',
        participants: [
          {
            name: participantName,
            joinedAt: new Date(),
          },
        ],
        maxParticipants: 10,
      });

      return { roomId, participantName };
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  /**
   * Join an existing chat room
   */
  async joinChatRoom(roomId: string): Promise<{ participantName: string }> {
    try {
      const roomRef = doc(db, 'chat_rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomSnap.data();

      // Check if room is closed
      if (roomData['status'] === 'closed') {
        throw new Error('Room is closed');
      }

      // Check if room expired
      const expiresAt = roomData['expiresAt'].toDate();
      if (expiresAt < new Date()) {
        throw new Error('Room has expired');
      }

      // Check participant limit
      const participants = roomData['participants'] || [];
      if (participants.length >= roomData['maxParticipants']) {
        throw new Error('Room is full');
      }

      // Generate participant name
      const participantName = this.generateRandomParticipantName();

      // Add participant
      const updatedParticipants = [
        ...participants,
        {
          name: participantName,
          joinedAt: new Date(),
        },
      ];

      await updateDoc(roomRef, {
        participants: updatedParticipants,
      });

      return { participantName };
    } catch (error) {
      console.error('Error joining chat room:', error);
      throw error;
    }
  }

  /**
   * Send a chat message
   */
  async sendChatMessage(roomId: string, participantName: string, message: string): Promise<void> {
    try {
      // Rate limiting check
      const rateLimitKey = `${roomId}_${participantName}`;
      const now = Date.now();
      const rateLimit = this.messageRateLimits.get(rateLimitKey);

      if (rateLimit) {
        if (now < rateLimit.resetTime) {
          // Still in the rate limit window
          if (rateLimit.count >= this.MAX_MESSAGES_PER_WINDOW) {
            const secondsRemaining = Math.ceil((rateLimit.resetTime - now) / 1000);
            throw new Error(`Rate limit exceeded. Please wait ${secondsRemaining} second(s) before sending another message.`);
          }
          rateLimit.count++;
        } else {
          // Reset the rate limit window
          this.messageRateLimits.set(rateLimitKey, {
            count: 1,
            resetTime: now + this.RATE_LIMIT_WINDOW,
          });
        }
      } else {
        // First message from this participant in this room
        this.messageRateLimits.set(rateLimitKey, {
          count: 1,
          resetTime: now + this.RATE_LIMIT_WINDOW,
        });
      }

      // Clean up old rate limit entries periodically
      if (Math.random() < 0.01) {
        // 1% chance to clean up
        this.cleanupRateLimits();
      }

      // Input validation
      if (!message || typeof message !== 'string') {
        throw new Error('Message is required');
      }

      const trimmedMessage = message.trim();

      if (trimmedMessage.length < this.MIN_MESSAGE_LENGTH) {
        throw new Error('Message cannot be empty');
      }

      if (trimmedMessage.length > this.MAX_MESSAGE_LENGTH) {
        throw new Error(`Message cannot exceed ${this.MAX_MESSAGE_LENGTH} characters`);
      }

      // Validate participant name format
      if (!participantName || typeof participantName !== 'string' || participantName.length !== 10) {
        throw new Error('Invalid participant name');
      }

      // Sanitize message (remove potential XSS)
      const sanitizedMessage = this.sanitizeMessage(trimmedMessage);

      const roomRef = doc(db, 'chat_rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomSnap.data();

      // Check if room is closed
      if (roomData['status'] === 'closed') {
        throw new Error('Room is closed');
      }

      // Check if room expired
      const expiresAt = roomData['expiresAt'].toDate();
      if (expiresAt < new Date()) {
        throw new Error('Room has expired');
      }

      // Verify participant is in room
      const participants = roomData['participants'] || [];
      const participantExists = participants.some((p: any) => p.name === participantName);
      if (!participantExists) {
        throw new Error('You are not a participant in this room');
      }

      // Add message to subcollection
      await addDoc(collection(db, 'chat_rooms', roomId, 'messages'), {
        participantName,
        message: sanitizedMessage,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Subscribe to chat messages (real-time updates)
   */
  subscribeToChatMessages(roomId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const messagesRef = collection(db, 'chat_rooms', roomId, 'messages');
    const messagesQuery = query(messagesRef);

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        participantName: doc.data()['participantName'],
        message: doc.data()['message'],
        timestamp: doc.data()['timestamp'],
      }));

      // Sort by timestamp
      messages.sort((a, b) => {
        const aTime = a.timestamp?.toMillis?.() || 0;
        const bTime = b.timestamp?.toMillis?.() || 0;
        return aTime - bTime;
      });

      callback(messages);
    });

    return unsubscribe;
  }

  /**
   * Subscribe to chat room updates (real-time)
   */
  subscribeToChatRoom(roomId: string, callback: (room: ChatRoom | null) => void): () => void {
    const roomRef = doc(db, 'chat_rooms', roomId);

    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const data = snapshot.data();
      const room: ChatRoom = {
        roomId: data['roomId'],
        createdAt: data['createdAt'],
        expiresAt: data['expiresAt'].toDate(),
        status: data['status'],
        participants: data['participants'] || [],
        maxParticipants: data['maxParticipants'],
      };

      callback(room);
    });

    return unsubscribe;
  }

  /**
   * Delete all chat messages
   */
  async deleteAllChatMessages(roomId: string): Promise<void> {
    try {
      const messagesRef = collection(db, 'chat_rooms', roomId, 'messages');
      const messagesQuery = query(messagesRef);
      const snapshot = await getDocs(messagesQuery);

      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting all chat messages:', error);
      throw error;
    }
  }

  /**
   * Close chat room (kicks everyone and deletes room)
   */
  async closeChatRoom(roomId: string): Promise<void> {
    try {
      const roomRef = doc(db, 'chat_rooms', roomId);

      // Delete all messages first
      await this.deleteAllChatMessages(roomId);

      // Delete the room
      await deleteDoc(roomRef);
    } catch (error) {
      console.error('Error closing chat room:', error);
      throw error;
    }
  }

  // Add constants at the top of the class
  private readonly MAX_MESSAGE_LENGTH = 1000;
  private readonly MIN_MESSAGE_LENGTH = 1;

  // Add at the top of the class
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
  private readonly MAX_MESSAGES_PER_WINDOW = 10;
  private messageRateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  // Add sanitization method
  private sanitizeMessage(message: string): string {
    // Remove HTML tags to prevent XSS
    return message
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Add cleanup method for rate limits
  private cleanupRateLimits(): void {
    const now = Date.now();
    for (const [key, limit] of this.messageRateLimits.entries()) {
      if (now >= limit.resetTime) {
        this.messageRateLimits.delete(key);
      }
    }
  }
}
