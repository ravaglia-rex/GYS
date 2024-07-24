import React, { useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import * as Sentry from '@sentry/react';

interface CameraAccessDialogProps {
  hasCameraAccess: boolean;
  setHasCameraAccess: (hasAccess: boolean) => void;
}

const CameraAccessDialog: React.FC<CameraAccessDialogProps> = ({ hasCameraAccess, setHasCameraAccess }) => {

    const checkCameraAccess = useCallback(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                setHasCameraAccess(true);
                stream.getTracks().forEach(track => track.stop());
            })
            .catch((error) => {
                Sentry.withScope((scope) => {
                    scope.setTag('location', 'CameraAccessDialog.checkCameraAccess');
                    Sentry.captureException(error);
                });
                setHasCameraAccess(false);
            });
    }, [setHasCameraAccess]);

    return (
        <Dialog open={!hasCameraAccess}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Camera Permissions or Lighting Conditions Insufficient</DialogTitle>
                    <DialogDescription>
                        Please ensure that you have given permission to access your camera and that the lighting conditions are sufficient.
                    </DialogDescription>
                </DialogHeader>
                
                <DialogFooter>
                    <DialogTrigger asChild>
                        <Button onClick={checkCameraAccess}>Check Camera Access</Button>
                    </DialogTrigger>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default CameraAccessDialog;