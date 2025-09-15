import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';
import { sqliteStorage } from '../storage-sqlite';

export interface User {
  id: string;
  username: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async register(credentials: RegisterCredentials): Promise<User> {
    const { username, password } = credentials;

    // Check if user already exists
    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    // Validate password strength
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user in database
    const userId = crypto.randomUUID();
    const userData = {
      id: userId,
      username,
      passwordHash,
      isActive: true,
      createdAt: new Date(),
    };

    // Insert user into database
    const db = sqliteStorage.getDatabase();
    await db.insert(users).values(userData);

    // Return user without password
    const user: User = {
      id: userId,
      username,
      isActive: true,
      createdAt: new Date(),
    };

    return user;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    const { username, password } = credentials;

    // Get user from database
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('La cuenta está desactivada');
    }

    // Update last login
    await this.updateLastLogin(user.id);

    // Set current user
    this.currentUser = {
      id: user.id,
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: new Date(),
    };

    return this.currentUser;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
  }

  async getUserByUsername(username: string): Promise<any> {
    const db = sqliteStorage.getDatabase();
    const result = await db.select().from(users).where(eq(users.username, username)).get();
    return result;
  }

  async getUserById(id: string): Promise<User | null> {
    const db = sqliteStorage.getDatabase();
    const result = await db.select().from(users).where(eq(users.id, id)).get();
    
    if (!result) return null;

    return {
      id: result.id,
      username: result.username,
      isActive: result.isActive,
      createdAt: result.createdAt,
      lastLogin: result.lastLogin,
    };
  }

  async updateLastLogin(userId: string): Promise<void> {
    const db = sqliteStorage.getDatabase();
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, userId));
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user
    const user = await this.getUserByUsername(this.currentUser?.username || '');
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verify current password
    const isValidPassword = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password in database
    const db = sqliteStorage.getDatabase();
    await db.update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, userId));
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  async initializeDefaultUser(): Promise<void> {
    // Check if any users exist
    const db = sqliteStorage.getDatabase();
    const userCount = await db.select().from(users).limit(1);
    
    if (userCount.length === 0) {
      // Create default admin user
      const defaultPassword = 'admin123';
      const passwordHash = await this.hashPassword(defaultPassword);
      
      const defaultUser = {
        id: crypto.randomUUID(),
        username: 'admin',
        passwordHash,
        isActive: true,
        createdAt: new Date(),
      };

      await db.insert(users).values(defaultUser);
      console.log('Usuario por defecto creado: admin / admin123');
    }
  }
}

export const authService = AuthService.getInstance();
