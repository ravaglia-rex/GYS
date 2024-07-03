import React, { useRef, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';
import { Clock, Lock, Check, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";
import StartExamButton from "./StartExamButton";

type ExamCardProps = React.ComponentProps<typeof Card> & {
  formID: string;
  cardTitle: string;
  cardDescription: string;
  duration: number;
  paymentNeeded: boolean;
  examDetails: string[];
  additionalInstructions: string[];
  isProctored: boolean;
  isEligible: boolean;
  eligibilityAt: string;
  hasCleared?: boolean | null;
  hasCompleted?: boolean;
};

const ExamCard: React.FC<ExamCardProps> = ({
  formID,
  className,
  cardTitle,
  cardDescription,
  duration,
  examDetails,
  additionalInstructions,
  paymentNeeded,
  isProctored,
  isEligible,
  eligibilityAt,
  hasCleared,
  hasCompleted,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardDimensions, setCardDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (cardRef.current) {
      setCardDimensions({
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
      });
    }
  }, [cardRef]);

  const calculateTimeRemaining = (eligibilityAt: string) => {
    const eligibilityDate = new Date(eligibilityAt);
    const currentDate = new Date();
    const diffTime = Math.max(eligibilityDate.getTime() - currentDate.getTime(), 0);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { diffDays, diffHours };
  };

  const { diffDays, diffHours } = calculateTimeRemaining(eligibilityAt);

  const renderOverlay = () => {
    if (hasCleared !== undefined && hasCleared !== null) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`absolute flex items-center justify-center z-20 cursor-not-allowed ${hasCleared ? 'bg-green-800' : 'bg-yellow-800'} bg-opacity-75 text-white`}
                style={{ width: cardDimensions.width, height: cardDimensions.height }}
              >
                {hasCleared ? <Check className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="z-30">
              {hasCleared ? "You have cleared this exam" : "You have not cleared this exam"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (hasCompleted) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute flex items-center justify-center z-20 cursor-not-allowed bg-gray-800 bg-opacity-75 text-white"
                style={{ width: cardDimensions.width, height: cardDimensions.height }}
              >
                <Clock className="h-8 w-8" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="z-30">
              You have completed this exam. Waiting for results.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (!isEligible) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute flex items-center justify-center z-20 cursor-not-allowed bg-gray-800 bg-opacity-75 text-white"
                style={{ width: cardDimensions.width, height: cardDimensions.height }}
              >
                <Lock className="h-8 w-8" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="z-30">
              Available in {diffDays} days and {diffHours} hours
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return null;
  };

  return (
    <div className="relative w-[380px]">
      <div ref={cardRef} className="relative rounded-lg overflow-hidden">
        {renderOverlay()}
        <Card className={cn("relative rounded-lg", !isEligible ? 'pointer-events-none' : '', className)} {...props}>
          <CardHeader>
            <CardTitle>{cardTitle}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              <span>{duration} hour{duration > 1 ? "s" : ""}</span>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-4">
              {examDetails.map((detailString, index) => {
                let detail;
                try {
                  detail = JSON.parse(detailString);
                } catch (e) {
                  return null;
                }
                return (
                  <div key={index} className="mb-4">
                    <p className="text-lg font-medium">{detail.section}</p>
                    <p className="text-sm">Questions: {detail.questions}</p>
                    <p className="text-sm text-muted-foreground">{detail.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 space-y-4">
              {additionalInstructions.map((instruction, index) => (
                <React.Fragment key={index}>
                  <p className="text-sm text-muted-foreground">
                    {instruction}
                  </p>
                  {index < additionalInstructions.length - 1 && (
                    <hr className="border-t border-gray-300" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            {hasCleared === undefined && <StartExamButton formId={formID} paymentNeeded={paymentNeeded} isProctored={isProctored} />}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ExamCard;
