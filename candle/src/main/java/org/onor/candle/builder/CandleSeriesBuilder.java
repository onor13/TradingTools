package org.onor.candle.builder;

import org.onor.candle.Candle;

import java.util.ArrayList;
import java.util.List;

public class CandleSeriesBuilder {

    CandleBuilder candleBuilder = new CandleBuilder();
    double defaultCandleSeparation = candleBuilder.getDefaultCandleLength()/2;

    private final List<Candle> candles= new ArrayList<>();

    public CandleSeriesBuilder(Candle first) {
        candles.add(first);
    }

    public CandleSeriesBuilder(List<Candle> candles) {
        this.candles.addAll(candles);
    }

    public List<Candle> getResultCandles() {
        return candles;
    }

    public void addCandles(List<Candle> candles) {
        this.candles.addAll(candles);
    }

    public void addDownCloseSeries(int quantity) {
        double previousCandleClose = getSeparatorSize(candles.getLast());
        for(int i=0; i<quantity; i++) {
            Candle downCandle = candleBuilder.createDownCandle(previousCandleClose - defaultCandleSeparation);
            candles.add(downCandle);
            previousCandleClose = downCandle.getClose();
        }
    }

    public void addBigDownCloseSeries(int quantity) {
        double previousCandleClose = getSeparatorSize(candles.getLast());
        for(int i=0; i<quantity; i++) {
            Candle downCandle = candleBuilder.createBigDownCandle(previousCandleClose - defaultCandleSeparation);
            candles.add(downCandle);
            previousCandleClose = downCandle.getClose();
        }
    }

    public void addUpCloseSeries(int quantity) {
        double previousCandleClose = getSeparatorSize(candles.getLast());
        for(int i=0; i<quantity; i++) {
            Candle upCandle = candleBuilder.createUpCandle(previousCandleClose + defaultCandleSeparation);
            candles.add(upCandle);
            previousCandleClose = upCandle.getClose();
        }
    }

    public void addBigUpCloseSeries(int quantity) {
        double previousCandleClose = getSeparatorSize(candles.getLast());
        for(int i=0; i<quantity; i++) {
            Candle upCandle = candleBuilder.createBigUpCandle(previousCandleClose + defaultCandleSeparation);
            candles.add(upCandle);
            previousCandleClose = upCandle.getClose();
        }
    }

    public void addUpDoji() {
        double previousCandleClose = getSeparatorSize(candles.getLast());
        Candle doji = candleBuilder.createUpDojiCandle(previousCandleClose);
        candles.add(doji);
    }

    public void addDownDoji() {
        double previousCandleClose = getSeparatorSize(candles.getLast());
        Candle doji = candleBuilder.createDownDojiCandle(previousCandleClose);
        candles.add(doji);
    }

    private double getSeparatorSize(Candle lastCandle) {
        return lastCandle.getClose() + defaultCandleSeparation;
    }
}
