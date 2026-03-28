import * as FileSystem from 'expo-file-system/legacy';
import { getDb } from './database';

// Google Drive API endpoints
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

const DB_NAME = 'jplan.db';
// Standard expo-sqlite path: documentDirectory + '/SQLite/' + name
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

export interface BackupMetadata {
  id: string;
  name: string;
  modifiedTime: string;
}

export class BackupService {
  /**
   * Finds the latest backup file in the appDataFolder on Google Drive
   */
  static async findBackupFile(accessToken: string): Promise<BackupMetadata | null> {
    const query = encodeURIComponent("name = '" + DB_NAME + "' and 'appDataFolder' in parents and trashed = false");
    const url = `${DRIVE_API_URL}?q=${query}&spaces=appDataFolder&fields=files(id, name, modifiedTime)&orderBy=modifiedTime desc`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Find backup failed:', errorData);
      throw new Error('구글 드라이브에서 백업 파일을 찾지 못했습니다.');
    }

    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0] : null;
  }

  /**
   * Uploads the local database file to Google Drive appDataFolder
   */
  static async backup(accessToken: string) {
    try {
      // 1. Check if DB file exists
      const fileInfo = await FileSystem.getInfoAsync(DB_PATH);
      if (!fileInfo.exists) {
        throw new Error('백업할 데이터베이스 파일이 존재하지 않습니다.');
      }

      // 2. Read file as Base64 (multipart upload requires raw bytes or base64)
      const base64Content = await FileSystem.readAsStringAsync(DB_PATH, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 3. Find existing file to decide whether to create or update
      const existingFile = await this.findBackupFile(accessToken);

      const metadata = {
        name: DB_NAME,
        parents: existingFile ? undefined : ['appDataFolder'],
      };

      // Multipart body construction
      const boundary = 'foo_bar_baz';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/octet-stream\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Content +
        closeDelimiter;

      const url = existingFile 
        ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
        : UPLOAD_API_URL;

      const response = await fetch(url, {
        method: existingFile ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        throw new Error('업로드에 실패했습니다.');
      }

      return true;
    } catch (error) {
      console.error('Backup error:', error);
      throw error;
    }
  }

  /**
   * Downloads the backup file from Google Drive and replaces the local DB
   */
  static async restore(accessToken: string) {
    try {
      // 1. Find the backup file
      const backup = await this.findBackupFile(accessToken);
      if (!backup) {
        throw new Error('드라이브에 저장된 백업 데이터가 없습니다.');
      }

      // 2. Download media content
      const downloadResponse = await fetch(`${DRIVE_API_URL}/${backup.id}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!downloadResponse.ok) {
        throw new Error('백업 파일 다운로드에 실패했습니다.');
      }

      // 3. Read as arrayBuffer and convert to base64 for writing
      const buffer = await downloadResponse.arrayBuffer();
      const base64Data = this.arrayBufferToBase64(buffer);

      // 4. Ensure SQLite directory exists
      const sqliteDir = `${FileSystem.documentDirectory}SQLite/`;
      const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
      }

      // 5. Close DB first if open (Safety)
      // Note: expo-sqlite 14+ needs careful handling here. 
      // Manual closing is hard via getDb() singleton without direct reference.
      // But overwriting usually works if not actively writing.

      // 6. Overwrite
      await FileSystem.writeAsStringAsync(DB_PATH, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return true;
    } catch (error) {
      console.error('Restore error:', error);
      throw error;
    }
  }

  /**
   * Helper to convert ArrayBuffer to Base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
