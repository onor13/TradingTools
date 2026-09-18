package org.onor.data;

import org.onor.candle.Candle;
import org.onor.candle.builder.CandlePatternsBuilder;
import org.onor.candle.builder.CandleSeriesBuilder;

import java.util.List;

public class PatternsToDisplay {

    public static List<Candle> basicStuff() {
        Candle first = new Candle(500.0, 510.0, 480.0, 515.0);
        CandleSeriesBuilder builder = new CandleSeriesBuilder(first);
        builder.addDownCloseSeries(3);
        builder.addUpCloseSeries(5);
        return builder.getResultCandles();
    }

    public List<Candle> breakOfInnerHigh() {
        CandleSeriesBuilder builder = new CandleSeriesBuilder(CandlePatternsBuilder.breakOfInnerHigh());
        builder.addUpDoji();
        builder.addBigDownCloseSeries(1);
        builder.addDownCloseSeries(2);
        return builder.getResultCandles();
    }

    public List<Candle> secondHigherLow() {
        CandleSeriesBuilder builder = new CandleSeriesBuilder(CandlePatternsBuilder.secondHigherLow());
        return builder.getResultCandles();
    }
}
