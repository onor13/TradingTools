package org.onor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Type reference for generic type handling.
 */
class CandleListTypeRef extends ArrayList<CandleJson> {}

/**
 * JSON serializer/deserializer for Candle and List<Candle>.
 */
public final class CandleJsonSerializer {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private CandleJsonSerializer() {
        // Private constructor to prevent instantiation
    }

    /**
     * Serialize a List<Candle> to JSON string.
     */
    public static String serialize(List<CandleJson> candles) throws JsonProcessingException {
        return objectMapper.writeValueAsString(candles);
    }

    /**
     * Serialize a List<Candle> to JSON string with pretty printing.
     */
    public static String serializePretty(List<CandleJson> candles) throws JsonProcessingException {
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        return objectMapper.writeValueAsString(candles);
    }

    /**
     * Deserialize JSON string to List<Candle>.
     */
    public static List<CandleJson> deserialize(String json) throws IOException {
        return objectMapper.readValue(json, CandleListTypeRef.class);
    }

    /**
     * Deserialize JSON string to List<Candle> with pretty printing.
     */
    public static List<CandleJson> deserializePretty(String json) throws IOException {
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        return deserialize(json);
    }

    /**
     * Deserialize a single Candle from JSON string.
     */
    public static CandleJson deserializeCandle(String json) throws IOException {
        return objectMapper.readValue(json, CandleJson.class);
    }

    /**
     * Deserialize a single Candle from JSON string with pretty printing.
     */
    public static CandleJson deserializeCandlePretty(String json) throws IOException {
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        return deserializeCandle(json);
    }

    /**
     * Create a Candle from JSON object string (e.g., {"open": 100, "close": 105}).
     */
    public static CandleJson createCandleFromJson(String json) throws IOException {
        return objectMapper.readValue(json, CandleJson.class);
    }

    /**
     * Create a Candle from JSON object string with pretty printing.
     */
    public static CandleJson createCandleFromJsonPretty(String json) throws IOException {
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        return createCandleFromJson(json);
    }

    /**
     * Serialize a List<Candle> to a JSON file.
     */
    public static void serializeToFile(List<CandleJson> candles, File outputFile) throws IOException {
        String json = serializePretty(candles);
        java.nio.file.Files.writeString(outputFile.toPath(), json);
    }

    /**
     * Deserialize a List<Candle> from a JSON file.
     */
    public static List<CandleJson> deserializeFromFile(File inputFile) throws IOException {
        String json = java.nio.file.Files.readString(inputFile.toPath());
        return deserialize(json);
    }

}
