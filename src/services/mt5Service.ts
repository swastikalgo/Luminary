/**
 * MT5 API Service
 * This service communicates with our Express server proxy to interact with the MT5 API.
 */

export interface MT5TradeRequest {
  symbol: string;
  type: 'Buy' | 'Sell';
  quantity: number;
  price?: number; // Optional for market orders
}

export interface MT5TradeResponse {
  success: boolean;
  orderId?: string;
  error?: string;
  message?: string;
}

export const mt5Service = {
  /**
   * Place a trade request to the MT5 API via our server-side proxy
   */
  placeTrade: async (trade: MT5TradeRequest): Promise<MT5TradeResponse> => {
    try {
      const response = await fetch('/api/mt5/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trade),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place trade on MT5');
      }

      const data = await response.json();
      return {
        success: true,
        orderId: data.order_id || data.id,
        message: data.message || 'Trade placed successfully on MT5',
      };
    } catch (error) {
      console.error('MT5 Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while placing trade',
      };
    }
  },

  /**
   * Check if the MT5 API is configured on the server
   */
  checkHealth: async (): Promise<{ status: string; mt5_configured: boolean }> => {
    try {
      const response = await fetch('/api/health');
      return await response.json();
    } catch (error) {
      console.error('MT5 Health Check Error:', error);
      return { status: 'error', mt5_configured: false };
    }
  }
};
