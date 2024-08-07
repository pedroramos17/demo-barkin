import DriverForm from '@/lib/features/drivers/form/DriverForm';

export default function EditFormDriver({ params }: Readonly<{ params: { id: string } }>) {
  const { id } = params;

  return (
    <DriverForm id={id} />
  );
}
