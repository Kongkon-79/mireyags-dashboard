import React from "react";
import EditCategoryForm from "./_components/edit-category-form";

const EditCategoryPage = ({ params }: { params: { id: string } }) => {
  return (
    <div className="p-6">
      <EditCategoryForm id={params.id} />
    </div>
  );
};

export default EditCategoryPage;