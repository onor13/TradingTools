package org.onor.candle.builder;

import org.onor.candle.Candle;

public class CandleBuilder {

    private final double bodyDelta = 5;

    public double getWickLength() {
        return wickLength;
    }

    private final double wickLength = 3;

    public Candle createUpCandle(Double reference) {
        double open = reference - bodyDelta;
        double close = reference + bodyDelta;
        return new Candle(open, close, open - wickLength, close + wickLength);
    }

    public Candle createDownCandle(Double reference) {
        double open = reference + bodyDelta;
        double close = reference - bodyDelta;
        return new Candle(open, close, open + wickLength, close - wickLength);
    }

    public Candle createBigUpCandle(Double reference) {
        double open = reference - bodyDelta * 2;
        double close = reference + bodyDelta * 2;
        return new Candle(open, close, open - wickLength, close + wickLength);
    }

    public Candle createBigDownCandle(Double reference) {
        double open = reference + bodyDelta * 2;
        double close = reference - bodyDelta * 2;
        return new Candle(open, close, open + wickLength, close - wickLength);
    }

    public Candle createUpDojiCandle(Double reference) {
        double open = reference - 1;
        double close = reference + 1;
        return new Candle(open, close, open - wickLength, close + wickLength);
    }

    public Candle createDownDojiCandle(Double reference) {
        double open = reference + 1;
        double close = reference - 1;
        return new Candle(open, close, open + wickLength, close - wickLength);
    }

    public Double getDefaultCandleLength() {
        return bodyDelta + wickLength * 2;
    }


}
