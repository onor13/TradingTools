package org.onor;

import org.onor.data.CandleData;

import java.util.List;



public class CandlesResponse {
    private List<CandleData> candles;

    public CandlesResponse() {}

    public CandlesResponse(List<CandleData> candles) {
        this.candles = candles;
    }

    public List<CandleData> getCandles() {
        return candles;
    }

    public void setCandles(List<CandleData> candles) {
        this.candles = candles;
    }
}
