import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { Reorder } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import EducationItem from "./EducationItem";
import { Education } from "@/types/resume";
import { generateUUID } from "@/utils/uuid";

const EducationPanel = () => {
  const { activeResume, updateEducation, updateEducationBatch } =
    useResumeStore();
  const { education = [] } = activeResume || {};
  const handleCreateProject = () => {
    const newEducation: Education = {
      id: generateUUID(),
      school: "学校名称",
      major: "专业",
      degree: "学历",
      startDate: "2015-09-01",
      endDate: "2019-06-30",
      description: "",
      visible: true,
    };
    updateEducation(newEducation);
  };

  return (
    <div
      className={cn(
        "space-y-4 px-4 py-4 rounded-lg",
        "dark:bg-neutral-900/30",
      )}
    >
      <Reorder.Group
        axis="y"
        values={education}
        onReorder={(newOrder) => {
          updateEducationBatch(newOrder);
        }}
        className="space-y-3"
      >
        {(education || []).map((education) => (
          <EducationItem
            key={education.id}
            education={education}
          ></EducationItem>
        ))}

        <Button onClick={handleCreateProject} className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" />
          {"添加教育经历"}
        </Button>
      </Reorder.Group>
    </div>
  );
};

export default EducationPanel;
