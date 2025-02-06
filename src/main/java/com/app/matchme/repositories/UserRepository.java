package com.app.matchme.repositories;

import com.app.matchme.entities.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<Users, Long> {

    Users findByEmail(String email);

    boolean existsByEmail(String email);

}
