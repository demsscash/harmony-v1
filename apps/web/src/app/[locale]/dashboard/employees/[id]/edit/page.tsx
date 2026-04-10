'use client';

import * as React from 'react';
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createEmployeeSchema, CreateEmployeeInput } from '@harmony/shared/schemas/employee.schema';
import api from '@/lib/api';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Save, User as UserIcon, Briefcase, FileText, CheckCircle2, CalendarIcon, ShieldCheck, Camera, X } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function EditEmployeePage() {
    const t = useTranslations('employees');
    const tc = useTranslations('common');
    const router = useRouter();
    const params = useParams();
    const employeeId = params?.id as string;
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const photoInputRef = React.useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 500 * 1024) { toast.error('Photo trop volumineuse (max 500 Ko)'); return; }
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setPhotoPreview(result);
            methods.setValue('photo', result);
        };
        reader.readAsDataURL(file);
    };

    // Organization Data for Selects
    const [departments, setDepartments] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

    const methods = useForm<CreateEmployeeInput>({
        resolver: zodResolver(createEmployeeSchema),
        defaultValues: {
            firstName: '', lastName: '', email: '', phone: '', cin: '', address: '',
            position: '', departmentId: undefined, gradeId: undefined,
            contractType: 'CDI', baseSalary: 0, currency: 'MRU',
            hireDate: new Date().toISOString().split('T')[0], status: 'ACTIVE',
        },
        mode: 'onChange'
    });

    const { register, handleSubmit, formState: { errors } } = methods;

    React.useEffect(() => {
        const fetchOrgData = async () => {
            try {
                const [deptRes, gradeRes, empRes] = await Promise.all([
                    api.get('/departments').catch(() => ({ data: { success: true, data: [] } })),
                    api.get('/grades').catch(() => ({ data: { success: true, data: [] } })),
                    api.get('/employees').catch(() => ({ data: { success: true, data: [] } })),
                ]);

                if (deptRes.data.success) setDepartments(deptRes.data.data);
                if (gradeRes.data.success) setGrades(gradeRes.data.data);
                if (empRes.data.success) setEmployees(empRes.data.data);

                if (employeeId) {
                    const empDetailRes = await api.get(`/employees/${employeeId}`);
                    if (empDetailRes.data.success) {
                        const emp = empDetailRes.data.data;
                        methods.reset({
                            firstName: emp.firstName || '',
                            lastName: emp.lastName || '',
                            email: emp.email || '',
                            phone: emp.phone || '',
                            cin: emp.cin || '',
                            address: emp.address || '',
                            position: emp.position || '',
                            departmentId: emp.departmentId || '',
                            gradeId: emp.gradeId || '',
                            contractType: emp.contractType || 'CDI',
                            baseSalary: Number(emp.baseSalary) || 0,
                            currency: emp.currency || 'MRU',
                            hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            status: emp.status || 'ACTIVE',
                            managerId: emp.managerId || '',
                            orgLevelId: emp.orgLevelId || '',
                            photo: emp.photo || '',
                        });
                        if (emp.photo) setPhotoPreview(emp.photo);
                    }
                }
            } catch (error) {
                console.error("Failed to load organization data:", error);
                toast.error(t('loadError'));
            } finally {
                setIsFetching(false);
            }
        };
        fetchOrgData();
    }, [employeeId, methods]);

    const onSubmit = async (data: CreateEmployeeInput) => {
        setIsLoading(true);
        const formattedData = {
            ...data,
            baseSalary: Number(data.baseSalary),
            departmentId: data.departmentId === "" ? undefined : data.departmentId,
            managerId: data.managerId === "" ? undefined : data.managerId,
            gradeId: data.gradeId === "" ? undefined : data.gradeId,
            orgLevelId: data.orgLevelId === "" ? undefined : data.orgLevelId,
        };

        try {
            // X-Tenant-Subdomain will be injected by the Axios interceptor
            const response = await api.put(`/employees/${employeeId}`, formattedData);

            if (response.data.success) {
                toast.success(t('updatedSuccess'), {
                    description: t('updatedDesc', { firstName: data.firstName, lastName: data.lastName }),
                });
                setTimeout(() => router.push(`/dashboard/employees/${employeeId}`), 1000);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || t('updateError'));
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link href={`/dashboard/employees/${employeeId}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-full bg-slate-100 hover:bg-slate-200">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">{t('editCollaborator')}</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-11 text-sm">{t('editCollaboratorDesc')}</p>
                </div>
            </motion.div>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                    {/* SECTION 1: Personal Info */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><UserIcon className="h-5 w-5" /></div>
                                <div><h2 className="text-lg font-bold text-slate-900">{t('identityContact')}</h2><p className="text-xs text-slate-500 font-medium">{t('personalInfo')}</p></div>
                            </div>
                            <CardContent className="p-6 space-y-6">
                                {/* Photo upload */}
                                <div className="flex items-center gap-5">
                                    <div className="relative group">
                                        {photoPreview ? (
                                            <img src={photoPreview} alt="Photo" className="h-20 w-20 rounded-full object-cover border-2 border-blue-200 shadow-sm" />
                                        ) : (
                                            <div className="h-20 w-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                                                <Camera className="h-6 w-6 text-slate-400" />
                                            </div>
                                        )}
                                        {photoPreview && (
                                            <button type="button" onClick={() => { setPhotoPreview(null); methods.setValue('photo', null); }} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm hover:bg-red-600">
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                            {photoPreview ? t('changePhoto') : t('addPhoto')}
                                        </button>
                                        <p className="text-xs text-slate-400 mt-0.5">PNG, JPG — max 500 Ko</p>
                                        <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoChange} className="hidden" />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('firstNameLabel')}</Label>
                                    <Input placeholder={t('firstNamePlaceholder')} {...register('firstName')} className={`h-11 bg-slate-50 ${errors.firstName ? 'border-red-500' : ''}`} />
                                    {errors.firstName && <p className="text-xs text-red-500 font-medium">{errors.firstName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('lastNameLabel')}</Label>
                                    <Input placeholder={t('lastNamePlaceholder')} {...register('lastName')} className={`h-11 bg-slate-50 ${errors.lastName ? 'border-red-500' : ''}`} />
                                    {errors.lastName && <p className="text-xs text-red-500 font-medium">{errors.lastName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('dateOfBirthLabel')}</Label>
                                    <Input type="date" {...register('dateOfBirth')} className="h-11 bg-slate-50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('professionalEmail')}</Label>
                                    <Input type="email" placeholder={t('emailPlaceholder')} {...register('email')} className="h-11 bg-slate-50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('phoneLabel')}</Label>
                                    <Input type="tel" placeholder="+222 44 XX XX XX" {...register('phone')} className={`h-11 bg-slate-50 ${errors.phone ? 'border-red-500' : ''}`} />
                                    {errors.phone && <p className="text-xs text-red-500 font-medium">{errors.phone.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('nniPassport')}</Label>
                                    <Input placeholder={t('cinPlaceholder')} {...register('cin')} className={`h-11 bg-slate-50 ${errors.cin ? 'border-red-500' : ''}`} />
                                    {errors.cin && <p className="text-xs text-red-500 font-medium">{errors.cin.message}</p>}
                                </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* SECTION 2: Job & Position */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><Briefcase className="h-5 w-5" /></div>
                                <div><h2 className="text-lg font-bold text-slate-900">{t('positionDeployment')}</h2><p className="text-xs text-slate-500 font-medium">{t('hierarchicalAssignment')}</p></div>
                            </div>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('positionTitle')}</Label>
                                        <Input placeholder="ex: Développeur Fullstack" {...register('position')} className={`h-11 bg-slate-50 ${errors.position ? 'border-red-500' : ''}`} />
                                        {errors.position && <p className="text-xs text-red-500 font-medium">{errors.position.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('gradeLevel')}</Label>
                                        <select {...register('gradeId')} className="w-full h-11 rounded-xl border border-input bg-slate-50 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                            <option value="">{t('noGradeOption')}</option>
                                            {grades.sort((a, b) => b.level - a.level).map(grade => (
                                                <option key={grade.id} value={grade.id}>{grade.name} (Lvl {grade.level})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Affectation */}
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('departmentLabel')}</Label>
                                        <select {...register('departmentId')} className="w-full h-11 rounded-xl border border-input bg-slate-50 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                            <option value="">{t('notAssignedOption')}</option>
                                            {(() => {
                                                const grouped = new Map<string, any[]>();
                                                for (const dept of departments) {
                                                    const key = dept.orgLevel?.name || '';
                                                    if (!grouped.has(key)) grouped.set(key, []);
                                                    grouped.get(key)!.push(dept);
                                                }
                                                const entries = Array.from(grouped.entries()).sort(([, a], [, b]) => (a[0]?.orgLevel?.rank ?? 999) - (b[0]?.orgLevel?.rank ?? 999));
                                                return entries.map(([levelName, depts]) => (
                                                    <optgroup key={levelName || 'other'} label={levelName || '—'}>
                                                        {depts.map(dept => (
                                                            <option key={dept.id} value={dept.id}>
                                                                {dept.parent ? `${dept.parent.name} → ` : ''}{dept.name}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                ));
                                            })()}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('directManager')}</Label>
                                        <select {...register('managerId')} className="w-full h-11 rounded-xl border border-input bg-slate-50 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                            <option value="">{t('noManagerOption')}</option>
                                            {employees.filter(emp => emp.id !== employeeId).map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} — {emp.position}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* SECTION 3: Contract & Salary */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="border-slate-200 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><FileText className="h-5 w-5" /></div>
                                <div><h2 className="text-lg font-bold text-slate-900">{t('contractRemuneration')}</h2><p className="text-xs text-slate-500 font-medium">{t('legalSalaryBases')}</p></div>
                            </div>
                            <CardContent className="p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('contractTypeLabel')}</Label>
                                    <select {...register('contractType')} className="w-full h-11 rounded-xl border border-input bg-slate-50 px-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="CDI">CDI</option>
                                        <option value="CDD">CDD</option>
                                        <option value="STAGE">Stage</option>
                                        <option value="PRESTATION">Prestation</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('hireDateLabel')}</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input type="date" {...register('hireDate')} className={`pl-10 h-11 bg-slate-50 font-medium ${errors.hireDate ? 'border-red-500' : ''}`} />
                                    </div>
                                    {errors.hireDate && <p className="text-xs text-red-500 font-medium pt-1">{errors.hireDate.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('baseSalaryLabel')}</Label>
                                    <Input type="number" min="0" step="1" {...register('baseSalary', { valueAsNumber: true })} className={`h-11 bg-slate-50 font-bold text-slate-900 ${errors.baseSalary ? 'border-red-500' : ''}`} />
                                    {errors.baseSalary && <p className="text-xs text-red-500 font-medium">{errors.baseSalary.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('currencyLabel')}</Label>
                                    <select {...register('currency')} className="w-full h-11 rounded-xl border border-input bg-slate-50 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="MRU">MRU (Ouguiya)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="USD">USD ($)</option>
                                    </select>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between p-6 bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-800 sticky bottom-6 z-20">
                        <div className="hidden md:flex items-center gap-2 text-slate-400">
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            <span className="text-sm">{t('dataEncrypted')}</span>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Link href="/dashboard/employees" className="w-full md:w-auto">
                                <Button type="button" variant="outline" className="w-full h-12 bg-transparent text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white rounded-xl font-medium">
                                    {tc('cancel')}
                                </Button>
                            </Link>
                            <Button type="submit" disabled={isLoading} className="w-full md:w-auto h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                {isLoading ? t('saving') : t('update')}
                            </Button>
                        </div>
                    </div>

                </form>
            </FormProvider>
        </div>
    );
}
