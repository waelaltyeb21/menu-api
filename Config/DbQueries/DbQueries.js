// Get All Documents
const GetAllDocs = async (Model, Selector = {}) => {
  const Docs = await Model.find(Selector);
  return Docs;
};

// Get One Document
const GetDoc = async (Model, id) => {
  const Doc = await Model.findById(id);
  return Doc;
};

// Get One Document
const CheckDoc = async (Model, Selector = {}) => {
  const Doc = await Model.find(Selector);
  console.log("#Doc: ", Doc);
  return Doc.length != 0;
};

// Create New Document
const CreateNewDoc = async (Model, Selector = {}, data) => {
  const Check = await CheckDoc(Model, Selector);
  console.log("Check: ", Check);
  if (!Check) {
    const CreateDoc = new Model(data);
    await CreateDoc.save();
    return [CreateDoc];
  }
  return false;
};

// Update Document
const UpdateDoc = async (Model, id, data) => {
  const Doc = await Model.findByIdAndUpdate(id, { $set: data }, { new: true });
  console.log("Doc To Update: ", Doc);
  return Doc;
};

// Delete Document
const DeleteDoc = async (Model, id) => {
  const Doc = await Model.findByIdAndDelete(id);
  console.log(`Order With ID ${id} Has Been Deleted`);
  console.log("Order", Doc);
  return Doc != null;
};

module.exports = {
  GetAllDocs,
  GetDoc,
  CreateNewDoc,
  UpdateDoc,
  DeleteDoc,
};
