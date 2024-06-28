import { Clock, Lock } from "lucide-react";
import { cn } from "../../lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

import StartExamButton from "./StartExamButton";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';

type ExamDetail = {
  section: string;
  questions: number;
  description: string;
};

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
  ...props
}) => {
  const calculateTimeRemaining = (eligibilityAt: string) => {
    const eligibilityDate = new Date(eligibilityAt);
    const currentDate = new Date();
    const diffTime = Math.max(eligibilityDate.getTime() - currentDate.getTime(), 0);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { diffDays, diffHours };
  };

  const { diffDays, diffHours } = calculateTimeRemaining(eligibilityAt);

  return (
    <div className="relative w-[380px]">
      {!isEligible && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-20 rounded-lg cursor-not-allowed">
                <Lock className="h-8 w-8 text-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="z-30">
              Available in {diffDays} days and {diffHours} hours
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
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
              let detail: ExamDetail;
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
          <div className="pt-4">
            {additionalInstructions.map((instruction, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {instruction}
              </p>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <StartExamButton formId={formID} paymentNeeded={paymentNeeded} isProctored={isProctored} />
        </CardFooter>
      </Card>
    </div>
  );
};

export default ExamCard;
