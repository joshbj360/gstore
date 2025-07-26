export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: string;
          avatar: string | null;
          username: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: string;
          avatar?: string | null;
          username?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          avatar?: string | null;
          username?: string | null;
          created_at?: string;
        };
      };
      order_items: {
        Row: {
          id: number;
          orderId: number;
          productId: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          orderId: number;
          productId: number;
          quantity: number;
          created_at?: string;
        };
      };
    };
  };
}