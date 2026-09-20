package org.onor.mapper;

import org.onor.CandleJson;
import org.onor.candle.Candle;
import org.onor.candle.CandleDirection;

public class CandleMapper {

    public CandleMapper() {
    }

    public Candle mapToCandle(CandleJson candleJson) {
        return new Candle(
            candleJson.getOpen(),
            candleJson.getClose(),
            candleJson.getLow(),
            candleJson.getHigh()
        );
    }

    public CandleJson mapToCandleJson(Candle candle) {
        return new CandleJson(
            candle.getOpen(),
            candle.getClose(),
            candle.getLow(),
            candle.getHigh()
        );
    }
}
