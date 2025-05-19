export class NotificationService {
  private static instance: NotificationService;
  private notificationSound: HTMLAudioElement | null = null;
  private unreadCount: number = 0;
  private faviconElement: HTMLLinkElement | null = null;
  private originalFavicon: string = '/favicon.ico';
  private unreadFavicon: string = '/favicon-unread.ico';
  private titlePrefix: string = '(新消息) ';
  private originalTitle: string = '';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.notificationSound = new Audio('/notification.mp3');
      this.faviconElement = document.querySelector('link[rel="icon"]');
      if (this.faviconElement) {
        this.originalFavicon = this.faviconElement.href;
      }
      this.originalTitle = document.title;
    }
    this.requestPermission();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async requestPermission() {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  }

  public async showNotification(title: string, body: string) {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      });
      this.playSound();
    }
  }

  private playSound() {
    if (this.notificationSound) {
      this.notificationSound.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
    }
  }

  public updateUnreadCount(count: number) {
    this.unreadCount = count;
    this.updateFavicon();
    this.updateTitle();
  }

  public incrementUnreadCount() {
    this.unreadCount++;
    this.updateFavicon();
    this.updateTitle();
  }

  public resetUnreadCount() {
    if (this.unreadCount > 0) {
      this.unreadCount = 0;
      this.updateFavicon();
      this.updateTitle();
    }
  }

  private updateTitle() {
    if (typeof window !== 'undefined') {
      if (this.unreadCount > 0) {
        document.title = `${this.titlePrefix}(${this.unreadCount}) ${this.originalTitle}`;
      } else {
        document.title = this.originalTitle;
      }
    }
  }

  private updateFavicon() {
    if (this.faviconElement) {
      this.faviconElement.href = this.unreadCount > 0 ? this.unreadFavicon : this.originalFavicon;
    }
  }

  public handleNewMessage(message: { content: string }) {
    if (document.hidden) {
      this.playSound();
      this.showNotification('新消息', message.content);
      this.incrementUnreadCount();
    }
  }
} 