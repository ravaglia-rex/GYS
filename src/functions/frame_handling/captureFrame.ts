import React from "react";

export const captureFrame = (videoRef: React.RefObject<HTMLVideoElement>, canvasRef: React.MutableRefObject<HTMLCanvasElement | null>, videoWorkerRef: React.MutableRefObject<Worker | undefined>) => {
    if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        
        if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const timestamp = new Date();
        videoWorkerRef.current?.postMessage({imageData, timestamp});
        }
    }
};