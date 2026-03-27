type AppHeaderProps = {
  title?: string;
};

export const AppHeader = ({
  title = "Система управления тостами",
}: AppHeaderProps) => {

  return (
    <header className="header">
      <h1>{title}</h1>
    </header>
  );
};
