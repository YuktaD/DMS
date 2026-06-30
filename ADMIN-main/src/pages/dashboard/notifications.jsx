import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Input,
  Button,
} from "@material-tailwind/react";
import { addGrampanchayat, resetGrampanchayatStatus } from '../../store/slices/doctorSlice';

export function Notifications() {
  const dispatch = useDispatch();
  const { loading, error, isGrampanchayatAdded, grampanchayatMessage } = useSelector(
    (state) => state.doctor
  );

  const [formData, setFormData] = useState({
    name: '',
    gstNo: '',
    gpMobileNumber: '',
    state: '',
    district: '',
    tahsil: '',
    village: '',
    grampanchayat: '',
  });
  
  const [gpImage, setGpImage] = useState(null);

  useEffect(() => {
    if (isGrampanchayatAdded) {
      setFormData({
        name: '',
        gstNo: '',
        gpMobileNumber: '',
        state: '',
        district: '',
        tahsil: '',
        village: '',
        grampanchayat: '',
      });
      setGpImage(null);
    }
  }, [isGrampanchayatAdded]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setGpImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });
    
    if (gpImage) {
      formDataToSend.append('gpImage', gpImage);
    }

    dispatch(addGrampanchayat(formDataToSend));
  };

  const handleReset = () => {
    setFormData({
      name: '',
      gstNo: '',
      gpMobileNumber: '',
      state: '',
      district: '',
      tahsil: '',
      village: '',
      grampanchayat: '',
    });
    setGpImage(null);
    dispatch(resetGrampanchayatStatus());
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <Typography variant="h6" color="white">
            Gram Panchayat Registration Form
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <div className="w-full px-6">
            <form className="mt-8 mb-2" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="mb-4">
                  <Typography variant="small" className="mb-2 block text-xs font-bold uppercase text-blue-gray-600">
                    Gram Panchayat Name
                  </Typography>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    label="Enter Gram Panchayat Name"
                    color="blue-gray"
                    className="w-full"
                    required
                  />
                </div>

                {/* GST Number */}
                <div className="mb-4">
                  <Typography variant="small" className="mb-2 block text-xs font-bold uppercase text-blue-gray-600">
                    GST Number
                  </Typography>
                  <Input
                    type="text"
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleInputChange}
                    label="Enter GST Number"
                    color="blue-gray"
                    className="w-full"
                    required
                  />
                </div>

                {/* Mobile Number */}
                <div className="mb-4">
                  <Typography variant="small" className="mb-2 block text-xs font-bold uppercase text-blue-gray-600">
                    Mobile Number
                  </Typography>
                  <Input
                    type="tel"
                    name="gpMobileNumber"
                    value={formData.gpMobileNumber}
                    onChange={handleInputChange}
                    label="Enter Mobile Number"
                    color="blue-gray"
                    className="w-full"
                    required
                  />
                </div>

                {/* State */}
                <div className="mb-4">
                  <Typography variant="small" className="mb-2 block text-xs font-bold uppercase text-blue-gray-600">
                    State
                  </Typography>
                  <Input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    label="Enter State"
                    color="blue-gray"
                    className="w-full"
                    required
                  />
                </div>

                {/* District */}
                <div className="mb-4">
                  <Typography variant="small" className="mb-2 block text-xs font-bold uppercase text-blue-gray-600">
                    District
                  </Typography>
                  <Input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    label="Enter District"
                    color="blue-gray"
                    className="w-full"
                    required
                  />
                </div>

                {/* Tahsil */}
                <div className="mb-4">
                  <Typography variant="small" className="mb-2 block text-xs font-bold uppercase text-blue-gray-600">
                    Tahsil
                  </Typography>
                  <Input
                    type="text"
                    name="tahsil"
                    value={formData.tahsil}
                    onChange={handleInputChange}
                    label="Enter Tahsil"
                    color="blue-gray"
                    className="w-full"
                    required
                  />
                </div>

                {/* Village */}
                <div className="mb-4">
                  <Typography variant="small" className="mb-2 block text-xs font-bold uppercase text-blue-gray-600">
                    Village
                  </Typography>
                  <Input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleInputChange}
                    label="Enter Village"
                    color="blue-gray"
                    className="w-full"
                    required
                  />
                </div>

                {/* Grampanchayat */}
                <div className="mb-4">
                  <Typography variant="small" className="mb-2 block text-xs font-bold uppercase text-blue-gray-600">
                    Grampanchayat
                  </Typography>
                  <Input
                    type="text"
                    name="grampanchayat"
                    value={formData.grampanchayat}
                    onChange={handleInputChange}
                    label="Enter Grampanchayat"
                    color="blue-gray"
                    className="w-full"
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="mb-4">
                  <Typography variant="small" className="mb-2 block text-xs font-bold uppercase text-blue-gray-600">
                    Grampanchayat Image
                  </Typography>
                  <Input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <Typography className="mt-4 text-red-500">
                  {error}
                </Typography>
              )}
              {grampanchayatMessage && (
                <Typography className="mt-4 text-green-500">
                  {grampanchayatMessage}
                </Typography>
              )}

              {/* Form Actions */}
              <div className="mt-6 flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outlined"
                  color="blue-gray"
                  className="flex items-center gap-3"
                  onClick={handleReset}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  color="gray"
                  className="flex items-center gap-3"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Notifications;