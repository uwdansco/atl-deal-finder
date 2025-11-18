-- Add price_source column to price_history table
ALTER TABLE price_history 
ADD COLUMN price_source TEXT NOT NULL DEFAULT 'amadeus';

-- Add a comment to document the column
COMMENT ON COLUMN price_history.price_source IS 'API source that provided the price: amadeus or google_flights';

-- Create an index for faster filtering by source
CREATE INDEX idx_price_history_source ON price_history(price_source);