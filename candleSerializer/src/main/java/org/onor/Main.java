package org.onor;

import java.io.File;
import java.util.List;

import static org.onor.CandleJsonSerializer.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);

    static void main() {
        //TIP Press <shortcut actionId="ShowIntentionActions"/> with your caret at the highlighted text
        // to see how IntelliJ IDEA suggests fixing it.
        List<CandleJson> candles = List.of(
                new CandleJson(100.0, 105.0, 98.0, 106.0),
                new CandleJson(105.0, 102.0, 101.0, 107.0),
                new CandleJson(102.0, 108.0, 100.0, 109.0)
        );

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
