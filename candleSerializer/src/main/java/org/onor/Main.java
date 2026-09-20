package org.onor;

import java.io.File;
import java.util.List;

import static org.onor.CandleJsonSerializer.*;

import org.onor.candle.Candle;
import org.onor.candle.builder.CandlePatternsBuilder;
import org.onor.mapper.CandleMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);
    private static final CandleMapper mapper = new CandleMapper();

    static void main() {

        //TIP Press <shortcut actionId="ShowIntentionActions"/> with your caret at the highlighted text
        // to see how IntelliJ IDEA suggests fixing it.
        List<Candle> innerHigh = CandlePatternsBuilder.breakOfInnerHigh();
        List<CandleJson> candles = innerHigh.stream().map(mapper::mapToCandleJson).toList();


        try {
            // Serialize to JSON string (pretty printed)
            String json = serializePretty(candles);
            logger.info("Serialized JSON:");
            logger.info(json);

            // Deserialize from JSON string
            List<CandleJson> deserialized = deserializePretty(json);
            logger.info("\nDeserialized {} candles", deserialized.size());

            // Serialize to file
            File outputFile = new File("candles.json");
            serializeToFile(candles, outputFile);
            logger.info("\nWrote to: {}", outputFile.getAbsolutePath());

            // Deserialize from file
            List<CandleJson> fromFile = deserializeFromFile(outputFile);
            logger.info("Read {} candles from file", fromFile.size());

        } catch (Exception e) {
            logger.error("An error occurred", e);
        }
    }
}
