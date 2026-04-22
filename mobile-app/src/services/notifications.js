/**
 * Push-Benachrichtigungen Service
 * 
 * Verwaltet lokale und Push-Benachrichtigungen für wichtige Events:
 * - Ladevorgang abgeschlossen
 * - Batterie kritisch niedrig
 * - PV-Überschuss verfügbar
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Benachrichtigungs-Handler konfigurieren
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.lastNotifications = {};
    this.notificationCooldown = 300000; // 5 Minuten
  }

  /**
   * Berechtigung für Push-Notifications anfordern
   */
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Push-Benachrichtigungen nicht erlaubt');
        return false;
      }

      console.log('✅ Push-Benachrichtigungen erlaubt');
      return true;
    } catch (error) {
      console.error('❌ Fehler bei Benachrichtigungs-Berechtigung:', error);
      return false;
    }
  }

  /**
   * Lokale Benachrichtigung senden
   */
  async sendLocalNotification(title, body, data = {}) {
    try {
      // Cooldown prüfen (verhindert Spam)
      const notificationKey = `${title}_${body}`;
      const now = Date.now();
      const lastSent = this.lastNotifications[notificationKey];

      if (lastSent && now - lastSent < this.notificationCooldown) {
        console.log('⏱️ Benachrichtigung im Cooldown:', title);
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: true,
        },
        trigger: null, // Sofort senden
      });

      this.lastNotifications[notificationKey] = now;
      console.log('📨 Benachrichtigung gesendet:', title);
    } catch (error) {
      console.error('❌ Fehler beim Senden der Benachrichtigung:', error);
    }
  }

  /**
   * Benachrichtigung: Laden abgeschlossen
   */
  async notifyChargingComplete(soc) {
    await this.sendLocalNotification(
      '🔋 Laden abgeschlossen',
      `Ihr E-Auto ist vollständig geladen (${Math.round(soc)}%)`,
      { type: 'charging_complete', soc }
    );
  }

  /**
   * Benachrichtigung: Batterie niedrig
   */
  async notifyLowBattery(soc, deviceType = 'ev') {
    const emoji = deviceType === 'ev' ? '🚗' : '🔋';
    const name = deviceType === 'ev' ? 'E-Auto' : 'Heim-Batterie';
    
    await this.sendLocalNotification(
      `⚠️ ${name} Batterie niedrig`,
      `${emoji} Ladestand nur noch ${Math.round(soc)}% - bitte laden`,
      { type: 'low_battery', soc, deviceType }
    );
  }

  /**
   * Benachrichtigung: PV-Überschuss verfügbar
   */
  async notifyPvSurplus(power) {
    await this.sendLocalNotification(
      '☀️ PV-Überschuss verfügbar',
      `${power.toFixed(1)} kW Überschuss - jetzt laden empfohlen`,
      { type: 'pv_surplus', power }
    );
  }

  /**
   * Benachrichtigung: Günstige Strompreise
   */
  async notifyCheapElectricity(price) {
    await this.sendLocalNotification(
      '💰 Günstige Strompreise',
      `Aktueller Preis: ${price.toFixed(2)} €/kWh - jetzt laden spart Geld`,
      { type: 'cheap_electricity', price }
    );
  }

  /**
   * Benachrichtigung: AI-Empfehlung
   */
  async notifyAiRecommendation(action) {
    await this.sendLocalNotification(
      '🤖 AI-Empfehlung',
      action,
      { type: 'ai_recommendation', action }
    );
  }

  /**
   * Alle Benachrichtigungen löschen
   */
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
    console.log('🗑️ Alle Benachrichtigungen gelöscht');
  }
}

export default new NotificationService();
