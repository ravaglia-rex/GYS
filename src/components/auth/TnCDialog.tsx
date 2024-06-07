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
import { Label } from "../ui/label";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Button } from "../ui/button";

const TnCDialog: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Label className="cursor-pointer text-blue-600 underline">Accept terms and conditions</Label>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read and accept our terms and conditions before using the platform.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-60">
          <div className="p-4">
            <p>
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aperiam ducimus odio magnam necessitatibus repudiandae porro molestias, nobis ipsam corrupti, dolorem, dolor perferendis totam tenetur doloremque exercitationem inventore? Minima, rerum quisquam.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod malesuada. Nullam ac odio eu lectus bibendum ullamcorper at a justo. Cras aliquet condimentum nisi, at volutpat purus eleifend non. Donec vel tincidunt felis, id molestie est.
            </p>
            <p>
              Quisque laoreet, diam non egestas consequat, eros nisi consectetur leo, ut tincidunt justo urna non arcu. Curabitur varius, nulla a ultricies suscipit, arcu sapien dignissim lectus, nec luctus elit sapien nec erat. Morbi mattis sapien sit amet tincidunt facilisis. Phasellus eget justo est.
            </p>
            <p>
              Phasellus auctor suscipit orci, ac tempus arcu sagittis in. Duis id elit non est vehicula rhoncus et nec metus. Praesent malesuada libero vel libero vulputate, at egestas mauris mattis. Ut imperdiet magna in tellus luctus, eget euismod eros bibendum. Ut at turpis lacinia, ullamcorper ligula quis, efficitur eros. Integer at mi id dui aliquet euismod.
            </p>
            <p>
              Nullam egestas, libero vitae commodo congue, lectus quam ornare nibh, nec scelerisque tortor augue id lectus. Sed aliquam justo vitae ligula fermentum, nec gravida orci convallis. Maecenas hendrerit, turpis in consectetur dictum, risus felis ullamcorper nulla, et interdum orci elit et magna.
            </p>
          </div>
          <ScrollBar />
        </ScrollArea>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button>Close</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TnCDialog;
