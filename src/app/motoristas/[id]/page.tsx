import DriverForm from '@/app/components/forms/DriverForm';

export default function EditFormDriver({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <DriverForm id={id} />
  );
}
