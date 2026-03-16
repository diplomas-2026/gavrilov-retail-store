package com.company.product.api.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class PickupCodeBarcodeService {

    public String buildQrSvg(String text, int sizePx) {
        try {
            BitMatrix matrix = new QRCodeWriter().encode(
                    text,
                    BarcodeFormat.QR_CODE,
                    sizePx,
                    sizePx,
                    Map.of(EncodeHintType.MARGIN, 1)
            );
            return toSvg(matrix);
        } catch (WriterException e) {
            throw new IllegalStateException("Не удалось создать QR‑код", e);
        }
    }

    private static String toSvg(BitMatrix matrix) {
        int width = matrix.getWidth();
        int height = matrix.getHeight();

        StringBuilder sb = new StringBuilder(16_000);
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.append("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"").append(width).append("\" height=\"").append(height)
                .append("\" viewBox=\"0 0 ").append(width).append(' ').append(height).append("\" shape-rendering=\"crispEdges\">");
        sb.append("<rect width=\"100%\" height=\"100%\" fill=\"#ffffff\"/>");

        sb.append("<path d=\"");
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                if (matrix.get(x, y)) {
                    sb.append('M').append(x).append(',').append(y).append("h1v1h-1z");
                }
            }
        }
        sb.append("\" fill=\"#111827\"/>");
        sb.append("</svg>");
        return sb.toString();
    }
}

