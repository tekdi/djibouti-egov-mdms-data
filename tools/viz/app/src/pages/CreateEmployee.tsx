import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useEmployeeApi } from '@/lib/api/employeeApi';

export default function CreateEmployee() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { createEmployee } = useEmployeeApi();

  // Available role options
  const roleOptions = [
    { code: 'BPA_SRA_SUB_DIRECTOR', name: 'BPA SRA SUB DIRECTOR' },
    { code: 'CITIZEN', name: 'Citizen' },
    { code: 'EMPLOYEE', name: 'Employee' },
    { code: 'UC_EMP', name: 'UC Employee' },
    { code: 'GRO', name: 'Grievance Routing Officer' },
    { code: 'DGRO', name: 'Divisional Grievance Routing Officer' },
    { code: 'CSR', name: 'Customer Service Representative' },
    { code: 'SUPERVISOR', name: 'Supervisor' },
    { code: 'ADMIN', name: 'Administrator' },
  ];

  // Form state with default values from CURL
  const [formData, setFormData] = useState({
    // Basic Info
    code: '',
    name: '',
    employeeStatus: 'EMPLOYED',
    employeeType: 'PERMANENT',
    
    // User Details
    userName: '',
    emailId: '',
    password: 'eGov@4321',
    mobileNumber: '77345345',
    dob: '1995-07-07',
    type: 'EMPLOYEE',
    active: true,
    
    // Addresses (pre-filled from CURL)
    permanentAddress: "Direction de l'aménagement du territoire et de l'Habitat (DATUH), H5H5+QF6 Z. Ind. sud Boulaos, Djibouti",
    permanentCity: 'Djibouti Ville',
    permanentPinCode: '771010',
    correspondenceAddress: "Direction de l'aménagement du territoire et de l'Habitat (DATUH), H5H5+QF6 Z. Ind. sud Boulaos, Djibouti",
    correspondenceCity: 'Djibouti Ville',
    correspondencePinCode: '771010',
    
    // Roles (pre-filled from CURL) - now an array
    roles: [{
      code: 'BPA_SRA_SUB_DIRECTOR',
      name: 'BPA SRA SUB DIRECTOR',
      tenantId: 'dj',
    }],
    
    // Assignment (pre-filled from CURL)
    designation: 'DESIG_04',
    department: 'DATUH',
    fromDate: '2025-01-13',
    
    // Jurisdiction (pre-filled from CURL)
    hierarchy: 'REVENUE',
    boundary: 'dj',
    boundaryType: 'City',
  });

  const handleInputChange = (field: string) => (value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addRole = () => {
    setFormData(prev => ({
      ...prev,
      roles: [...prev.roles, { code: '', name: '', tenantId: 'dj' }]
    }));
  };

  const removeRole = (index: number) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index)
    }));
  };

  const updateRole = (index: number, field: 'code' | 'name', value: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.map((role, i) => {
        if (i === index) {
          if (field === 'code') {
            // Auto-populate name when code is selected
            const selectedRole = roleOptions.find(opt => opt.code === value);
            return {
              ...role,
              code: value,
              name: selectedRole ? selectedRole.name : role.name
            };
          }
          return { ...role, [field]: value };
        }
        return role;
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      if (!formData.code || !formData.name || !formData.userName || !formData.emailId) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Code, Name, Username, Email)",
          variant: "destructive",
        });
        return;
      }

      // Create the employee payload matching the CURL structure
      const employeePayload = {
        tenantId: 'dj',
        code: formData.code,
        name: formData.name,
        employeeStatus: formData.employeeStatus,
        employeeType: formData.employeeType,
        user: {
          tenantId: 'dj',
          userName: formData.userName,
          emailId: formData.emailId,
          password: formData.password,
          name: formData.name,
          mobileNumber: formData.mobileNumber,
          dob: new Date(formData.dob).getTime(), // Convert to timestamp
          roles: formData.roles,
          active: formData.active,
          type: formData.type,
          permanentAddress: formData.permanentAddress,
          permanentCity: formData.permanentCity,
          permanentPinCode: formData.permanentPinCode,
          correspondenceAddress: formData.correspondenceAddress,
          correspondenceCity: formData.correspondenceCity,
          correspondencePinCode: formData.correspondencePinCode,
        },
        assignments: [{
          designation: formData.designation,
          department: formData.department,
          fromDate: new Date(formData.fromDate).getTime().toString(), // Convert to timestamp string
          isCurrentAssignment: true,
        }],
        jurisdictions: [{
          hierarchy: formData.hierarchy,
          boundary: formData.boundary,
          boundaryType: formData.boundaryType,
          active: true,
        }],
      };

      await createEmployee(employeePayload);
      
      toast({
        title: "Success",
        description: "Employee created successfully!",
      });
      
      navigate('/employees');

    } catch (error) {
      console.error('Error creating employee:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create employee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/employees')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Employee Management
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Employee</h1>
          <p className="text-gray-600 mt-2">
            Fill in the employee details. Default values are pre-populated for quick creation.
          </p>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <form onSubmit={handleSubmit} className="p-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="user">User Details</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Employee basic details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="code" className="text-sm font-medium">Employee Code *</label>
                        <Input
                          id="code"
                          placeholder="e.g., subdirector@gmail.com"
                          value={formData.code}
                          onChange={(e) => handleInputChange('code')(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">Full Name *</label>
                        <Input
                          id="name"
                          placeholder="e.g., test_sraSubDirector"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name')(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="employeeStatus" className="text-sm font-medium">Employee Status</label>
                        <Select
                          value={formData.employeeStatus}
                          onValueChange={handleInputChange('employeeStatus')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EMPLOYED">Employed</SelectItem>
                            <SelectItem value="RETIRED">Retired</SelectItem>
                            <SelectItem value="TERMINATED">Terminated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="employeeType" className="text-sm font-medium">Employee Type</label>
                        <Select
                          value={formData.employeeType}
                          onValueChange={handleInputChange('employeeType')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERMANENT">Permanent</SelectItem>
                            <SelectItem value="TEMPORARY">Temporary</SelectItem>
                            <SelectItem value="CONTRACT">Contract</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="user" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Account Details</CardTitle>
                    <CardDescription>Login credentials and personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="userName" className="text-sm font-medium">Username *</label>
                        <Input
                          id="userName"
                          placeholder="e.g., subdirector@gmail.com"
                          value={formData.userName}
                          onChange={(e) => handleInputChange('userName')(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="emailId" className="text-sm font-medium">Email *</label>
                        <Input
                          id="emailId"
                          type="email"
                          placeholder="e.g., subdirector@gmail.com"
                          value={formData.emailId}
                          onChange={(e) => handleInputChange('emailId')(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">Password</label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password')(e.target.value)}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="mobileNumber" className="text-sm font-medium">Mobile Number</label>
                        <Input
                          id="mobileNumber"
                          placeholder="77345345"
                          value={formData.mobileNumber}
                          onChange={(e) => handleInputChange('mobileNumber')(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="dob" className="text-sm font-medium">Date of Birth</label>
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dob}
                          onChange={(e) => handleInputChange('dob')(e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Role Assignment</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addRole}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Role
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {formData.roles.map((role, index) => (
                          <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                            <div className="flex-1 space-y-2">
                              <label className="text-sm font-medium">Role Code</label>
                              <Select
                                value={role.code}
                                onValueChange={(value) => updateRole(index, 'code', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role code" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roleOptions.map((option) => (
                                    <SelectItem key={option.code} value={option.code}>
                                      {option.code}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 space-y-2">
                              <label className="text-sm font-medium">Role Name</label>
                              <Select
                                value={role.name}
                                onValueChange={(value) => updateRole(index, 'name', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role name" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roleOptions.map((option) => (
                                    <SelectItem key={option.name} value={option.name}>
                                      {option.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {formData.roles.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeRole(index)}
                                className="flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assignment" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Assignment</CardTitle>
                    <CardDescription>Department and designation details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="designation" className="text-sm font-medium">Designation</label>
                        <Input
                          id="designation"
                          value={formData.designation}
                          onChange={(e) => handleInputChange('designation')(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="department" className="text-sm font-medium">Department</label>
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => handleInputChange('department')(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="fromDate" className="text-sm font-medium">Start Date</label>
                      <Input
                        id="fromDate"
                        type="date"
                        value={formData.fromDate}
                        onChange={(e) => handleInputChange('fromDate')(e.target.value)}
                      />
                    </div>

                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Jurisdiction</h4>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="hierarchy" className="text-sm font-medium">Hierarchy</label>
                          <Input
                            id="hierarchy"
                            value={formData.hierarchy}
                            onChange={(e) => handleInputChange('hierarchy')(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="boundary" className="text-sm font-medium">Boundary</label>
                          <Input
                            id="boundary"
                            value={formData.boundary}
                            onChange={(e) => handleInputChange('boundary')(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="boundaryType" className="text-sm font-medium">Boundary Type</label>
                          <Input
                            id="boundaryType"
                            value={formData.boundaryType}
                            onChange={(e) => handleInputChange('boundaryType')(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="address" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Address Information</CardTitle>
                    <CardDescription>Permanent and correspondence addresses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Permanent Address</h4>
                      <div className="space-y-2">
                        <label htmlFor="permanentAddress" className="text-sm font-medium">Address</label>
                        <Input
                          id="permanentAddress"
                          value={formData.permanentAddress}
                          onChange={(e) => handleInputChange('permanentAddress')(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="permanentCity" className="text-sm font-medium">City</label>
                          <Input
                            id="permanentCity"
                            value={formData.permanentCity}
                            onChange={(e) => handleInputChange('permanentCity')(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="permanentPinCode" className="text-sm font-medium">Pin Code</label>
                          <Input
                            id="permanentPinCode"
                            value={formData.permanentPinCode}
                            onChange={(e) => handleInputChange('permanentPinCode')(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Correspondence Address</h4>
                      <div className="space-y-2">
                        <label htmlFor="correspondenceAddress" className="text-sm font-medium">Address</label>
                        <Input
                          id="correspondenceAddress"
                          value={formData.correspondenceAddress}
                          onChange={(e) => handleInputChange('correspondenceAddress')(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="correspondenceCity" className="text-sm font-medium">City</label>
                          <Input
                            id="correspondenceCity"
                            value={formData.correspondenceCity}
                            onChange={(e) => handleInputChange('correspondenceCity')(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="correspondencePinCode" className="text-sm font-medium">Pin Code</label>
                          <Input
                            id="correspondencePinCode"
                            value={formData.correspondencePinCode}
                            onChange={(e) => handleInputChange('correspondencePinCode')(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/employee-management')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating Employee...' : 'Create Employee'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 