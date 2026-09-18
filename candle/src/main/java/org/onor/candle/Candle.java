package org.onor.candle;



public final class Candle {

    private final double open;
    private final double close;
    private final double low;
    private final double high;
    private final CandleDirection direction;


    public Candle(double open,
                  double close,
                  double low,
                  double high) {
        this.open = open;
        this.close = close;
        this.low = low;
        this.high = high;
        direction = close > open ? CandleDirection.UP : CandleDirection.DOWN;
    }

    public double getOpen() {
        return open;
    }

    public double getClose() {
        return close;
    }

    public double getLow() {
        return low;
    }

    public double getHigh() {
        return high;
    }

    public CandleDirection getDirection() {
        return direction;
    }

    public String getDirectionString() {
        return direction.name();
    }
}
