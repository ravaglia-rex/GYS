import { Check, Clock } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

type ExamDetail = {
  section: string;
  questions: number;
  description: string;
};

type ExamCardProps = React.ComponentProps<typeof Card> & {
  cardTitle: string;
  cardDescription: string;
  duration: number;
  examDetails: string[];
  additionalInstructions: string[];
};

const ExamCard: React.FC<ExamCardProps> = ({ className, cardTitle, cardDescription, duration, examDetails, additionalInstructions, ...props }) => {
  return (
    <Card className={cn("w-[380px]", className)} {...props}>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
        <div className="flex items-center mt-2 text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4" />
          <span>{duration} hours</span>
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
        <Button className="w-full">
          <Check className="mr-2 h-4 w-4" /> Start Exam
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExamCard;