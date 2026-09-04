import { AddFlightDemo } from "@/components/student/flights/add-flight-demo";

/** Fixture adapter for components/student/flights/add-flight-demo.tsx. */
export default function AddFlightPage() {
  return (
    <AddFlightDemo
      myFlightsHref="/prototype/vector/flights"
      debriefNewHref="/prototype/vector/debrief/new"
      homeHref="/prototype/vector"
    />
  );
}
