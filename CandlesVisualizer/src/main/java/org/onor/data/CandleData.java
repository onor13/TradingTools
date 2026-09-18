package org.onor.data;

public class CandleData {
    private final double open;
    private final double close;
    private final double low;
    private final double high;
    private final String direction;

    public CandleData(double open, double close, double low, double high, String direction) {
        this.open = open;
        this.close = close;
        this.low = low;
        this.high = high;
        this.direction = direction;
    }

    public double getOpen() { return open; }
    public double getClose() { return close; }
    public double getLow() { return low; }
    public double getHigh() { return high; }
    public String getDirection() { return direction; }

    @Override
    public String toString() {
        return "CandleData{open=" + open + ", close=" + close + ", low=" + low +
               ", high=" + high + ", direction='" + direction + "'}";
    }
}
