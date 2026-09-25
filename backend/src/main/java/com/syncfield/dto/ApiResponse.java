package com.syncfield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private T data;
    private String error;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .data(data)
                .error(null)
                .build();
    }

    public static <T> ApiResponse<T> failure(String error) {
        return ApiResponse.<T>builder()
                .data(null)
                .error(error)
                .build();
    }
}
