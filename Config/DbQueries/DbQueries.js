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
  console.log("Checked: ", Check, " Result: ", !Check);
  if (!Check) {
    const CreateDoc = new Model(data);
    return await CreateDoc.save();
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
  return Doc != null;
};

module.exports = {
  GetAllDocs,
  GetDoc,
  CreateNewDoc,
  UpdateDoc,
  DeleteDoc,
};
