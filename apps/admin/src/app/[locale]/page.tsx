import {redirect} from 'next/navigation';

type Props = {
  params: { locale: string };
};

export default function LocaleHomePage({ params }: Props) {
  redirect(`/${params.locale}/login`);
}