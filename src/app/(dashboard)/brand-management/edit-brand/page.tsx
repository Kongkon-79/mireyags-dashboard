import React from "react";
import EditBrandForm from "./_components/edit-brand-form";

const EditBrandPage = ({ params }: { params: { id: string } }) => {
  return (
    <div className="p-6">
      <EditBrandForm id={params.id} />
    </div>
  );
};

export default EditBrandPage;