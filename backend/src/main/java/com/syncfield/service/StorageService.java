package com.syncfield.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;

@Service
@Slf4j
public class StorageService {

    @Value("${syncfield.storage.local-dir:./storage-uploads}")
    private String localDir;

    public void init() {
        try {
            Files.createDirectories(Paths.get(localDir));
        } catch (IOException e) {
            log.error("Could not initialize storage directory", e);
        }
    }

    public Path getFilePath(String fileId, String fileName) {
        init();
        return Paths.get(localDir, fileId + "_" + fileName);
    }

    public Path appendChunk(String fileId, String fileName, int chunkIndex, byte[] chunkData) throws IOException {
        init();
        Path filePath = Paths.get(localDir, fileId + "_" + fileName);
        StandardOpenOption option = (chunkIndex == 0 && !Files.exists(filePath))
                ? StandardOpenOption.CREATE
                : StandardOpenOption.APPEND;

        Files.write(filePath, chunkData, option, StandardOpenOption.WRITE);
        return filePath;
    }

    public long getFileSize(String fileId, String fileName) {
        Path filePath = Paths.get(localDir, fileId + "_" + fileName);
        if (Files.exists(filePath)) {
            try {
                return Files.size(filePath);
            } catch (IOException e) {
                return 0;
            }
        }
        return 0;
    }

    public String computeFileHash(Path filePath) throws IOException {
        try (InputStream is = Files.newInputStream(filePath)) {
            return DigestUtils.sha256Hex(is);
        }
    }
}
