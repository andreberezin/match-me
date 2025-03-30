package com.app.matchme.seeders;

import com.app.matchme.entities.User;
import com.app.matchme.repositories.UserRepository;
import com.app.matchme.utils.GeoUtils;
import com.github.javafaker.Faker;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.HashMap;
import java.util.Map;

@Component
public class UserSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    private final Faker faker = new Faker();
    private static final Random random = new Random();

    // Map of Estonian locations with their approximate coordinates
    private final Map<String, double[]> estonianLocationCoordinates = new HashMap<String, double[]>() {{
        put("Harju County, Estonia", new double[]{59.4370, 24.7536});  // Tallinn area
        put("Tartu County, Estonia", new double[]{58.3780, 26.7290});  // Tartu area
        put("Ida-Viru County, Estonia", new double[]{59.3560, 27.4138}); // Narva area
        put("Pärnu County, Estonia", new double[]{58.3859, 24.4971});  // Pärnu area
        put("Viljandi County, Estonia", new double[]{58.3642, 25.5965}); // Viljandi area
        put("Lääne-Viru County, Estonia", new double[]{59.3534, 26.3595}); // Rakvere area
        put("Lääne County, Estonia", new double[]{58.9294, 23.5416}); // Haapsalu area
        put("Järva County, Estonia", new double[]{58.7869, 25.5600}); // Paide area
        put("Valga County, Estonia", new double[]{57.7770, 26.0475}); // Valga area
        put("Rapla County, Estonia", new double[]{58.9964, 24.7895}); // Rapla area
        put("Saare County, Estonia", new double[]{58.2528, 22.5039}); // Kuressaare area
        put("Võru County, Estonia", new double[]{57.8334, 27.0156}); // Võru area
        put("Põlva County, Estonia", new double[]{58.0603, 27.0684}); // Põlva area
    }};

    private final List<String> estonianCityLocations = new ArrayList<>(estonianLocationCoordinates.keySet());

    private final List<String> genderOptions = Arrays.asList("male", "female", "other");

    public static String getWeightedRandomGender() {
        double rand = random.nextDouble();

        if (rand < 0.45) return "any";
        else if (rand < 0.7) return "male";
        else if (rand < 0.95) return "female";
        else return "other";
    }

    private final List<String> musicGenres = Arrays.asList(
            "rock", "pop", "jazz", "hip-hop", "classical", "blues", "reggae", "metal",
            "country", "electronic", "folk", "funk", "soul", "punk", "rnb", "house",
            "techno", "indie", "gospel", "ska", "other"
    );

    private final List<String> methods = Arrays.asList(
            "singing", "djing", "piano", "guitar", "bass", "drums", "violin",
            "saxophone", "flute", "harp", "harmonica", "accordion", "ukulele",
            "keyboard", "cello", "sampling", "beatmaking", "looping", "sound_design",
            "midi", "vocoder", "electronic_drums", "beatboxing", "acapella", "rapping",
            "screaming", "falsetto", "head_voice", "harmonizing", "whispering", "voice_processing",
            "melismatic_singing", "field_recording", "found_sounds", "sound_collage",
            "live_instrumentation", "foley", "other"
    );

    private final List<String> interests = Arrays.asList(
            "sports", "movies", "books", "technology", "travel", "gaming", "art",
            "fitness", "cooking", "fashion", "history", "politics", "science",
            "photography", "education", "environment", "nature", "animals", "writing",
            "poetry", "theater", "comedy", "dancing", "gardening", "crafting",
            "mental_health", "self_improvement", "spirituality", "philanthropy",
            "social_media", "entrepreneurship", "marketing", "finance", "investing",
            "real_estate", "board_games", "esports", "virtual_reality", "fashion_design",
            "interior_design", "architecture", "astronomy", "space", "robotics",
            "fishing", "hiking", "cycling", "other"
    );

    private final List<String> personalityTraits = Arrays.asList(
            "introverted", "extroverted", "optimistic", "pessimistic", "creative",
            "analytical", "empathetic", "independent", "dependable", "adaptable",
            "organized", "spontaneous", "confident", "humble", "reliable", "loyal",
            "honest", "compassionate", "curious", "patient", "ambitious", "passionate",
            "self-disciplined", "funny", "sarcastic", "moody", "impulsive", "emotional",
            "stubborn", "practical", "realistic", "generous", "self-sufficient", "sensitive",
            "enthusiastic", "open-minded", "humorous", "thoughtful", "meticulous", "impassioned",
            "tolerant", "disciplined", "sociable", "resourceful", "visionary", "persuasive",
            "polite", "forgiving", "assertive", "inquisitive", "caring", "decisive"
    );

    private final List<String> goals = Arrays.asList(
            "have_fun", "make_a_band", "build_a_career", "collaborate_on_projects",
            "learn_new_skills", "perform_live", "write_original_music", "record_music",
            "experiment_with_genres", "create_impactful_music", "improve_technique",
            "network_in_music_industry", "make_music_videos", "gain_exposure",
            "join_music_community", "collaborate_with_others", "become_a_producer",
            "build_an_online_presence", "create_music_for_films", "inspire_others_with_music",
            "tour_and_perform", "create_a_music_label", "sell_music", "share_music_online",
            "release_albums", "achieve_mainstream_success", "collaborate_with_legendary_artists",
            "tour_worldwide", "stay_independent", "make_impactful_messages", "create_music_for_ads",
            "teach_music", "write_for_other_artists", "perform_in_famous_venues",
            "learn_music_theory", "form_a_collaborative_project", "create_instagram_music_content",
            "become_a_beatmaker", "join_a_music_festival", "promote_music_online",
            "collaborate_on_soundtracks", "find_other_musicians_online", "grow_music_collection",
            "participate_in_jams", "build_music_business", "produce_in_studios",
            "get_signed_to_a_label", "create_unique_music_ideas", "explore_music_collaborations"
    );

    private final List<String> matchLocationOptions = Arrays.asList("anywhere", "same_city", "same_country");

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            System.out.println("users already exist, stopping seeder");
            return;
        }

        List<User> users = new ArrayList<>();

        for (int i = 0; i < 100; i++) {
            User user = new User();
            user.setEmail(faker.internet().emailAddress());
            user.setPassword(encoder.encode("111"));
            user.setUsername(faker.name().firstName() + " " + faker.name().lastName());
            user.setGender(randomChoice(genderOptions));
            user.setAge(faker.number().numberBetween(16, 120));
            user.setProfilePicture(null);

            // Set location with coordinates
            String locationText = randomCityCountryFromEstonia();
            user.setLocation(locationText);

            // Set coordinates based on location
            double[] coordinates = estonianLocationCoordinates.get(locationText);
            if (coordinates != null) {
                // Add some randomness to coordinates to spread users around
                double lat = coordinates[0] + (random.nextDouble() - 0.5) * 0.1; // +/- 0.05 degrees (approx 5km)
                double lng = coordinates[1] + (random.nextDouble() - 0.5) * 0.1; // +/- 0.05 degrees
                Point point = GeoUtils.createPoint(lat, lng);
                user.setCoordinates(point);
            }

            // Set max match radius - random between 10-200km
            user.setMaxMatchRadius(random.nextInt(191) + 10); // 10-200km

            user.setDescription(faker.lorem().sentence());
            user.setLinkToMusic(faker.internet().url());
            user.setYearsOfMusicExperience(faker.number().numberBetween(0, 10));

            user.setPreferredMusicGenres(randomList(musicGenres, 1, 3));
            user.setPreferredMethods(randomList(methods, 1, 3));
            user.setAdditionalInterests(randomList(interests, 1, 3));
            user.setPersonalityTraits(randomList(personalityTraits, 1, 3));
            user.setGoalsWithMusic(randomList(goals, 1, 3));

            user.setIdealMatchGenres(randomList(musicGenres, 1, 3));
            user.setIdealMatchMethods(randomList(methods, 1, 3));
            user.setIdealMatchGoals(randomList(goals, 1, 3));

            user.setIdealMatchGender(getWeightedRandomGender());
            user.setIdealMatchAge(getWeightedRandomAgeRange());
            user.setIdealMatchLocation(randomChoice(matchLocationOptions));
            user.setIdealMatchYearsOfExperience(randomExperienceRange());

            users.add(user);
        }

        userRepository.saveAll(users);
        System.out.println("100 users successfully inserted with geolocation data");
    }

    private String randomChoice(List<String> options) {
        return options.get(random.nextInt(options.size()));
    }

    private List<String> randomList(List<String> options, int min, int max) {
        int count = random.nextInt(max - min + 1) + min;
        List<String> subset = new ArrayList<>();
        while (subset.size() < count) {
            String choice = randomChoice(options);
            if (!subset.contains(choice)) {
                subset.add(choice);
            }
        }
        return subset;
    }

    private String randomAgeRange() {
        List<String> ageRanges = Arrays.asList("12-21", "22-31", "32-41", "42-51", "52-61");
        return randomChoice(ageRanges);
    }

    public static String getWeightedRandomAgeRange() {
        double rand = random.nextDouble();

        if (rand < 0.5) return "any";
        else if (rand < 0.58) return "12-21";
        else if (rand < 0.66) return "22-31";
        else if (rand < 0.74) return "32-41";
        else if (rand < 0.82) return "42-51";
        else if (rand < 0.9) return "52-61";
        else if (rand < 0.92) return "62-71";
        else if (rand < 0.94) return "72-81";
        else if (rand < 0.96) return "82-91";
        else if (rand < 0.98) return "92-101";
        else if (rand < 0.99) return "102-111";
        else return "112-120";
    }

    private String randomExperienceRange() {
        List<String> experienceRanges = Arrays.asList("0-2", "3-5", "6-8", "9-11");
        return randomChoice(experienceRanges);
    }

    private String randomCityCountryFromEstonia() {
        return estonianCityLocations.get(random.nextInt(estonianCityLocations.size()));
    }
}
