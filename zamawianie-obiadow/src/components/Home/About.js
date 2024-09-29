import React from 'react';
import './About.css';

function About() {
  return (
    <div className="about-container">
      <h1>O Aplikacji "EduEat"</h1>
      <p>Nasza aplikacja "EduEat" to nowoczesne rozwiązanie dla szkół, które umożliwia uczniom, rodzicom oraz pracownikom oświaty łatwe i szybkie zamawianie posiłków na każdy dzień szkolny. Została stworzona z myślą o zapewnieniu wygody i organizacji procesu zamawiania obiadów, jednocześnie promując zdrowe nawyki żywieniowe.</p>
      
      {/* <h2>Funkcjonalności:</h2>
      <ul>
        <li>Zamawianie Online: Użytkownicy mogą zamawiać obiady na konkretny dzień, tydzień, miesiąc lub nawet cały rok szkolny.</li>
        <li>Automatyczne Promocje: System automatycznie promuje uczniów do następnej klasy na początku każdego roku szkolnego, co umożliwia zachowanie ciągłości zamówień.</li>
        <li>Płatności Elektroniczne: Bezpieczne płatności online z możliwością śledzenia historii transakcji i automatycznego przypomnienia o nadchodzących płatnościach.</li>
        <li>Zarządzanie Kontem: Użytkownicy mają dostęp do swojego konta, gdzie mogą sprawdzać saldo, historię zamówień oraz zarządzać swoimi danymi.</li>
        <li>Powiadomienia: System wysyła codzienne powiadomienia push, przypominając o zamówionych obiadach oraz umożliwiając ich modyfikację do określonej godziny.</li>
        <li>Kody QR: Każdy użytkownik otrzymuje osobisty kod QR, który służy do weryfikacji i potwierdzania odbioru posiłków.</li>
        <li>Raporty i Statystyki: Księgowi i administratorzy mogą generować szczegółowe raporty, listy uczestników oraz analizować statystyki dla poszczególnych klas i całej szkoły.</li>
      </ul>
      <p></p>
      <h2>Bezpieczeństwo i Prywatność:</h2>
      <p>Bezpieczeństwo danych użytkowników i ich prywatność są dla nas priorytetem. Stosujemy zaawansowane protokoły bezpieczeństwa, aby chronić informacje osobowe i finansowe każdego użytkownika.</p>

      <h2>Dla Kogo Jest Ta Aplikacja?</h2>
      <p>"Aplikacja EduEat" jest przeznaczona dla każdego członka społeczności szkolnej: uczniów, rodziców, nauczycieli i pracowników, zapewniając im wygodę i elastyczność w planowaniu posiłków.</p>
      
      <h2>Zaangażowanie w Środowisko Szkolne:</h2>
      <p>Nasza aplikacja została zaprojektowana, aby wspierać i angażować się w życie szkolne, ułatwiając organizację i planowanie w kuchni szkolnej, co przekłada się na mniej marnowania żywności i lepsze zarządzanie zasobami.</p>
      
      <h2>Rozwijaj z Nami Aplikację:</h2>
      <p>Jesteśmy otwarci na sugestie i gotowi na ciągłe ulepszanie naszej aplikacji, aby lepiej służyć naszej społeczności. Jeśli masz pomysły lub opinie, skontaktuj się z nami!</p> */}

      <div class="contact-container">
        <h1>Kontakt</h1>
        <p>Jojko Dominik</p>
        <p>Email: <a href="mailto:edueat.jd@gmail.com">edueat.jd@gmail.com</a></p>
      </div>

    </div>
  );
}

export default About;