import React from 'react';
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

interface FullScreenDialogProps {
  isFullScreen: boolean;
  isSubmitted: boolean;
}

const FullScreenDialog: React.FC<FullScreenDialogProps> = ({ isFullScreen, isSubmitted }) => {
    const enterFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        }
    };

    return (
        <Dialog open={(!isFullScreen && !isSubmitted)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>You switched out of full screen mode</DialogTitle>
                    <DialogDescription>
                        Please switch back to full screen to continue using the service. This will be recorded as a violation.
                    </DialogDescription>
                </DialogHeader>
                
                <DialogFooter>
                    <DialogTrigger asChild>
                        <Button onClick={enterFullScreen}>Enter Full Screen</Button>
                    </DialogTrigger>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default FullScreenDialog;
