package org.onor.candle.builder;

import org.onor.candle.Candle;

import java.util.ArrayList;
import java.util.List;

public class CandlePatternsBuilder {

    public static List<Candle> breakOfInnerHigh() {
        Candle first = new Candle(510.0, 500.0, 480.0, 515.0);
        CandleSeriesBuilder builder = new CandleSeriesBuilder(first);
        builder.addDownCloseSeries(3);
        builder.addUpCloseSeries(1);
        builder.addDownCloseSeries(3);
        builder.addBigUpCloseSeries(1);
        builder.addUpCloseSeries(1);
        return builder.getResultCandles();
    }

    public static List<Candle> secondHigherLow() {
        CandleSeriesBuilder builder = new CandleSeriesBuilder(CandlePatternsBuilder.breakOfInnerHigh());
        builder.addDownDoji();
        builder.addBigDownCloseSeries(1);
        builder.addDownCloseSeries(2);
        builder.addUpDoji();
        builder.addUpCloseSeries(1);
        builder.addDownCloseSeries(2);
        builder.addDownDoji();
        builder.addBigUpCloseSeries(2);
        builder.addUpCloseSeries(1);
        builder.addBigDownCloseSeries(3);
        builder.addBigUpCloseSeries(2);
        builder.addUpDoji();
        return builder.getResultCandles();
    }
}
