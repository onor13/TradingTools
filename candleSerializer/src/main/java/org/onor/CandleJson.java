package org.onor;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class CandleJson {
    private final double open;
    private final double close;
    private final double low;
    private final double high;

    @JsonCreator
    public CandleJson(@JsonProperty("open") double open,
                  @JsonProperty("close") double close,
                  @JsonProperty("low") double low,
                  @JsonProperty("high") double high) {
        this.open = open;
        this.close = close;
        this.low = low;
        this.high = high;
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
}
