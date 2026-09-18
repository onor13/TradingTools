package org.onor;

import org.onor.candle.Candle;
import org.onor.data.CandleData;
import org.onor.data.PatternsToDisplay;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequestMapping("/api")
public class MyController {

    private static final Logger logger = LoggerFactory.getLogger(MyController.class);
    private final PatternsToDisplay patternsToDisplay;

    public MyController() {
        this.patternsToDisplay = new PatternsToDisplay();
    }

    @GetMapping("/hello2")
    public String sayHello() {
        return "Hello World";
    }

    @GetMapping("/candles")
    public CandlesResponse getCandles() {
        List<Candle> candles = patternsToDisplay.secondHigherLow();
        // Convert to format expected by Angular frontend
        logger.info("Calling Get Candles");
        return new CandlesResponse(candles.stream()
            .map(c -> new CandleData(
                c.getOpen(),
                c.getClose(),
                c.getLow(),
                c.getHigh(),
                c.getDirectionString()
            ))
            .toList());
    }

    @GetMapping("/basic")
    public CandlesResponse getBasicCandles() {
        List<Candle> candles = PatternsToDisplay.basicStuff();
        return new CandlesResponse(candles.stream()
            .map(c -> new CandleData(
                c.getOpen(),
                c.getClose(),
                c.getLow(),
                c.getHigh(),
                c.getDirectionString()
            ))
            .toList());
    }

 /*   @PostMapping("/generate")
    public CandlesResponse generateCandles(@RequestBody int quantity) {
        List<Candle> candles = patternsToDisplay.basicStuff();
        return new CandlesResponse(candles.stream()
            .map(c -> new CandleData(
                c.getOpen(),
                c.getClose(),
                c.getLow(),
                c.getHigh(),
                c.getDirectionString()
            ))
            .toList());
    }*/
}
